import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { PlayerStats } from '../models/player_stats.model';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { playerWithPlansData } from '../dtos/response.dtos';
import type {
  CreateUserBodyRequest,
  GetPlayerDayPlanQuery,
} from '../dtos/request.dtos';
import { PatchUserBodyRequest } from '../dtos/request.dtos';
import { PlannedActivityService } from 'src/planned_activity/planned_activity.service';
import { PlannedActivity } from 'src/planned_activity/models/planned_activity.model';
import { MealService } from 'src/meal/meal.service';
import { Meal } from 'src/meal/models/meal.model';
import { PlayerSelfAssessmentService } from './player_self_assessment.service';
import type { UserAccess } from '../models/user.model';
import { CoachAssessmentService } from './coach_assessment.service';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopUserService } from 'src/whoop/services/user.service';
import type * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from 'src/auth/firebase-admin.provider';

const userAttributesToReturn = [
  'firebase_id',
  'email',
  'avatar_url',
  'access',
  'birth_date',
  'phone',
  'nationality',
  'display_name',
];

const playerStatsAttributesToReturn = [
  'dominant_hand',
  'win_rate',
  'matches_played',
  'serve_win_percentage',
  'third_ball_conversion_percentage',
  'receive_win_percentage',
  'height_cm',
];

const whoopUserAttributesToReturn = ['id', 'email', 'first_name', 'last_name'];

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @Inject(forwardRef(() => WhoopUserService))
    private readonly whoopUserService: WhoopUserService,
    @Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: typeof admin,
    private readonly httpService: HttpService,
    private readonly plannedActivityService: PlannedActivityService,
    private readonly mealService: MealService,
    private readonly playerSelfAssessmentService: PlayerSelfAssessmentService,
    private readonly coachAssessmentService: CoachAssessmentService,
  ) {}

  async getUser(firebase_id: string) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      attributes: userAttributesToReturn,
      include: [
        {
          model: PlayerStats,
          attributes: playerStatsAttributesToReturn,
        },
      ],
    });
    if (!user) throw new Error('user not found!');
    return user;
  }

  async getPlayers() {
    const players = await this.userModel.findAll({
      where: { access: 'player' },
      attributes: userAttributesToReturn,
      include: [
        {
          model: PlayerStats,
          attributes: playerStatsAttributesToReturn,
        },
        {
          model: WhoopUser,
          as: 'whoop_user',
          required: false,
          attributes: whoopUserAttributesToReturn,
        },
      ],
    });
    return players;
  }

  async getCoaches() {
    const coaches = await this.userModel.findAll({
      where: { access: 'coach' },
      attributes: userAttributesToReturn,
    });
    return coaches;
  }

  async patchUserByPk(
    {
      email,
      avatar_url,
      birth_date,
      phone,
      nationality,
      display_name,
      dominant_hand,
      height_cm,
    }: PatchUserBodyRequest,
    firebase_id: string,
  ) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: PlayerStats,
          required: true,
        },
      ],
    });
    if (!user) throw new Error('User not found');

    const updatedUser = await user.update({
      email: email,
      avatar_url: avatar_url,
      birth_date: birth_date,
      phone: phone,
      nationality: nationality,
      display_name: display_name,
    });

    if (user.player_stats) {
      await user.player_stats.update({
        dominant_hand: dominant_hand,
        height_cm: height_cm,
      });
    }

    return {
      ...updatedUser.get({ plain: true }),
      ...(user.player_stats ? user.player_stats.get({ plain: true }) : {}),
    };
  }

  async signUp(firebase_id: string, email: string, access: UserAccess) {
    let user = await this.userModel.findOne({ where: { firebase_id } });
    if (user) throw new Error('User already exists');

    user = await this.userModel.create({ firebase_id, email, access } as User);

    // Create empty player stats entry if user is a player
    if (access === 'player') {
      await this.playerStatsModel.create({
        user_id: user.id,
      } as PlayerStats);
    }

    return user;
  }

  private async calculatePlayerReadiness(
    player: User,
    mealsYesterday: Meal[],
    coachAssessmentsUsers: User[],
  ): Promise<number> {
    // [value (0-1), weight]
    const readinessScoreParts: [number, number][] = [];

    const cycleData = await this.whoopUserService.getSummaryForDateRange(
      player.firebase_id,
      new Date(),
      1,
    );

    if (Object.keys(cycleData).length > 0) {
      const d = Object.values(cycleData)[0];

      const sleepScore = d.sleep.score;
      const stressScore = 1 - d.basic.stress;
      const idealStrain = 0.75;
      const strainScore = 1 - Math.abs(d.basic.strain - idealStrain);

      readinessScoreParts.push([sleepScore, 1]);
      readinessScoreParts.push([stressScore, 1]);
      readinessScoreParts.push([strainScore, 1]);
    }

    const mealsAssignedYesterday = mealsYesterday.filter((meal) =>
      meal.players_assigned?.some(
        (assignment) => assignment.assigned_to === player.id,
      ),
    );

    const mealsCompletedYesterday = mealsAssignedYesterday.filter((meal) =>
      meal.players_assigned?.some(
        (assignment) => (assignment.completions?.length || 0) > 0,
      ),
    ).length;

    const mealsCompletionRatio =
      mealsCompletedYesterday / (mealsAssignedYesterday.length || 1);

    readinessScoreParts.push([mealsCompletionRatio, 1]);

    // Get yesterday's date for tiredness assessment
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const playerSelfAssessmentsYesterday =
      await this.playerSelfAssessmentService.getPlayerSelfAssessmentsForDate({
        firebase_id: player.firebase_id,
        date: yesterday,
      });

    const tirednessAssessment = playerSelfAssessmentsYesterday.find(
      (assessment) => assessment.assessment_type === 'tiredness',
    );

    if (tirednessAssessment && tirednessAssessment.score !== undefined) {
      // Tiredness is inverse - lower tiredness means higher readiness
      const tirednessScore = 1 - tirednessAssessment.score;
      readinessScoreParts.push([tirednessScore, 1]);
    }

    // Get today's assessments for readiness assessment
    const playerSelfAssessmentsToday =
      await this.playerSelfAssessmentService.getPlayerSelfAssessmentsForDate({
        firebase_id: player.firebase_id,
        date: new Date(),
      });

    const readinessAssessment = playerSelfAssessmentsToday.find(
      (assessment) => assessment.assessment_type === 'readiness',
    );
    if (readinessAssessment && readinessAssessment.score !== undefined) {
      readinessScoreParts.push([readinessAssessment.score, 1]);
    }

    // Get coach assessment for this player
    const coachAssessmentUser = coachAssessmentsUsers.find(
      (user) => user.firebase_id === player.firebase_id,
    );

    if (coachAssessmentUser?.player_stats?.coach_assessments) {
      const coachAssessments =
        coachAssessmentUser.player_stats.coach_assessments;

      if (coachAssessments.length > 0) {
        const coachAssessment = coachAssessments[0]; // Get the first assessment
        if (coachAssessment?.readiness_score !== undefined) {
          readinessScoreParts.push([coachAssessment.readiness_score, 1]);
        }
      }
    }

    const totalWeightedScore = readinessScoreParts.reduce(
      (acc, [value, weight]) => acc + value * weight,
      0,
    );
    const totalWeight = readinessScoreParts.reduce(
      (acc, [, weight]) => acc + weight,
      0,
    );
    const finalReadiness =
      totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return finalReadiness;
  }

  async getPlayersWeekPlans(): Promise<playerWithPlansData[]> {
    const players = await this.userModel.findAll({
      where: { access: 'player' },
    });

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date();
    endOfWeek.setHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 6);

    const plannedActivities =
      await this.plannedActivityService.getPlannedActivities({
        startDate: startOfWeek,
        endDate: endOfWeek,
        dayOfWeek: undefined,
        users_assigned: players.map((player) => player.firebase_id),
      });

    const meals = await this.mealService.getMeals({
      startDate: startOfWeek,
      endDate: endOfWeek,
      dayOfWeek: undefined,
      users_assigned: players.map((player) => player.firebase_id),
    });

    const startOfYesterday = new Date();
    startOfYesterday.setHours(0, 0, 0, 0);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date();
    endOfYesterday.setHours(23, 59, 59, 999);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const mealsYesterday = await this.mealService.getMeals({
      startDate: startOfYesterday,
      endDate: endOfYesterday,
      dayOfWeek: undefined,
      users_assigned: players.map((player) => player.firebase_id),
    });

    const today = new Date();
    const coachAssessmentsUsers =
      await this.coachAssessmentService.getCoachAssessmentsForAllPlayersOnDay({
        day: today,
      });

    const data: playerWithPlansData[] = [];
    for (const player of players) {
      const readiness = await this.calculatePlayerReadiness(
        player,
        mealsYesterday,
        coachAssessmentsUsers,
      );

      const anyPlannedActivities = plannedActivities.some((activity) =>
        activity.players_assigned?.some(
          (assignment) => assignment.assigned_to === player.id,
        ),
      );
      const anyMeals = meals.some((meal) =>
        meal.players_assigned?.some(
          (assignment) => assignment.assigned_to === player.id,
        ),
      );

      const age = player.birth_date
        ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
        : null;

      const playerData: playerWithPlansData = {
        id: player.firebase_id,
        email: player.email,
        display_name: player.display_name,
        age: age,
        readiness: readiness,
        meal: anyMeals ?? false,
        workout: anyPlannedActivities ?? false,
        nationality: player.nationality,
        photo_url: player.avatar_url,
      };

      data.push(playerData);
    }

    return data;
  }

  async getPlayerDayPlans({ firebase_id, day }: GetPlayerDayPlanQuery) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);
    const dayOfWeek = startOfDay
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase();

    const playerSelfAssessments =
      await this.playerSelfAssessmentService.getPlayerSelfAssessmentsForDate({
        firebase_id,
        date: day,
      });

    const plannedMeals = await this.mealService.getMeals({
      startDate: startOfDay,
      endDate: endOfDay,
      users_assigned: [firebase_id],
      onlyMatchSelectedPlayers: true,
      dayOfWeek,
    });

    const plannedActivities =
      await this.plannedActivityService.getPlannedActivities({
        startDate: startOfDay,
        endDate: endOfDay,
        users_assigned: [firebase_id],
        onlyMatchSelectedPlayers: true,
        dayOfWeek,
      });

    // Organize data: readiness at start, meals/activities in order, tiredness at end
    const dayPlan: Array<
      | {
          type: 'assessment';
          category: string;
          time: Date;
          isCompleted: boolean;
          data: PlayerSelfAssessment | null;
        }
      | {
          type: 'meal';
          category: string;
          time: Date;
          isCompleted: boolean;
          data: Meal;
        }
      | {
          type: 'activity';
          category: string;
          time: Date;
          isCompleted: boolean;
          data: PlannedActivity;
        }
    > = [];

    // 1. Add tiredness self assessment at the end
    const tirednessAssessment = playerSelfAssessments.find(
      (assessment) => assessment.assessment_type === 'tiredness',
    );

    const tirednessAssessmentTime = new Date(day);
    tirednessAssessmentTime.setHours(19, 0, 0, 0);
    dayPlan.push({
      type: 'assessment' as const,
      category: 'tiredness',
      time: tirednessAssessmentTime,
      isCompleted: tirednessAssessment ? true : false,
      data: tirednessAssessment ?? null,
    });

    // 2. Flatten and sort meals and activities by start time
    const mealsWithType = plannedMeals.map((meal) => ({
      type: 'meal' as const,
      category: meal.category,
      time: new Date(meal.start),
      isCompleted: (meal.players_assigned?.[0]?.completions?.length ?? 0) > 0,
      data: meal,
    }));

    const activitiesWithType = plannedActivities.map((activity) => ({
      type: 'activity' as const,
      category: activity.category,
      time: new Date(activity.start),
      isCompleted:
        (activity.players_assigned?.[0]?.completions?.length ?? 0) > 0,
      data: activity,
    }));

    const getTimeInDay = (time: Date) => {
      return (
        time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()
      );
    };

    // Sort time descending
    const combinedItems = [...mealsWithType, ...activitiesWithType].sort(
      (a, b) => getTimeInDay(b.time) - getTimeInDay(a.time),
    );

    dayPlan.push(...combinedItems);

    // 3. Add readiness self assessment at time 0
    const readinessAssessment = playerSelfAssessments.find(
      (assessment) => assessment.assessment_type === 'readiness',
    );

    const readinessAssessmentTime = new Date(day);
    readinessAssessmentTime.setHours(7, 0, 0, 0);
    dayPlan.push({
      type: 'assessment' as const,
      category: 'readiness',
      time: readinessAssessmentTime,
      isCompleted: readinessAssessment ? true : false,
      data: readinessAssessment ?? null,
    });

    return dayPlan;
  }

  async createUser(
    { email, password }: CreateUserBodyRequest,
    access: UserAccess,
  ) {
    // Check if user with this email already exists in database
    const existingUser = await this.userModel.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error('User with this email already exists in database');
    }

    let firebaseUser: admin.auth.UserRecord | undefined;
    let userWasCreated = false;

    try {
      // First, create a Firebase user with the provided email and password
      firebaseUser = await this.firebaseAdmin.auth().createUser({
        email,
        password,
        emailVerified: false,
      });
      userWasCreated = true;
    } catch (error: unknown) {
      // If user already exists in Firebase, get the existing user instead
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/email-already-exists'
      ) {
        try {
          firebaseUser = await this.firebaseAdmin.auth().getUserByEmail(email);
        } catch (getUserError) {
          const errorMessage =
            getUserError instanceof Error
              ? getUserError.message
              : 'Failed to get existing Firebase user';
          throw new Error(
            `Failed to get existing Firebase user: ${errorMessage}`,
          );
        }
      } else {
        // Handle other Firebase errors
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create Firebase user';
        throw new Error(`Firebase user creation failed: ${errorMessage}`);
      }
    }

    if (!firebaseUser) {
      throw new Error('Firebase user was not created or retrieved');
    }

    try {
      // Then, add the user to the database with the Firebase UID
      const user = await this.userModel.create({
        firebase_id: firebaseUser.uid,
        email,
        access: access,
      } as User);

      if (access === 'player') {
        // Create empty player stats entry for the new player
        await this.playerStatsModel.create({
          user_id: user.id,
        } as PlayerStats);
      }

      // Send password reset email to the user
      try {
        await this.sendPasswordResetEmail(email);
      } catch (emailError) {
        // Log the error but don't fail the user creation
        console.error('Failed to send password reset email:', emailError);
        // User is still created successfully, just the email failed
      }

      return user;
    } catch (error) {
      // If database creation fails, clean up the Firebase user only if we created it
      if (userWasCreated && firebaseUser) {
        try {
          await this.firebaseAdmin.auth().deleteUser(firebaseUser.uid);
        } catch (deleteError) {
          // Log but don't throw - the main error is more important
          console.error('Failed to clean up Firebase user:', deleteError);
        }
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create database user';
      throw new Error(`Database user creation failed: ${errorMessage}`);
    }
  }

  private async sendPasswordResetEmail(email: string): Promise<void> {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error('FIREBASE_API_KEY is not configured');
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          requestType: 'PASSWORD_RESET',
          email: email,
        }),
      );

      if (!response.data) {
        throw new Error('Failed to send password reset email');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Password reset email failed: ${errorMessage}`);
    }
  }

  async deleteUser(firebase_id: string) {
    const user = await this.userModel.findOne({ where: { firebase_id } });
    if (!user) throw new Error('User not found');

    // Delete WhoopUser if it exists
    const whoopUser = await this.whoopUserModel.findOne({
      where: { user_id: user.id },
    });
    if (whoopUser) {
      // Revoke access from Whoop OAuth servers
      await this.whoopUserService.revokeWhoopUserAccess(whoopUser);
      // Delete the local WhoopUser record
      await whoopUser.destroy();
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}
