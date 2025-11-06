import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { PlayerStats } from '../models/player_stats.model';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { playerWithPlansData } from '../dtos/response.dtos';
import type { GetPlayerDayPlanQuery } from '../dtos/request.dtos';
import { PatchUserBodyRequest } from '../dtos/request.dtos';
import { PlannedActivityService } from 'src/planned_activity/planned_activity.service';
import { PlannedActivity } from 'src/planned_activity/models/planned_activity.model';
import { MealService } from 'src/meal/meal.service';
import { Meal } from 'src/meal/models/meal.model';
import { PlayerSelfAssessmentService } from './player_self_assessment.service';
import type { UserAccess } from '../models/user.model';

const userAttributesToReturn = [
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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly plannedActivityService: PlannedActivityService,
    private readonly mealService: MealService,
    private readonly playerSelfAssessmentService: PlayerSelfAssessmentService,
  ) {}

  async getUser(firebase_id: string) {
    console.log('firebase_id', firebase_id);
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
      ],
    });
    return players;
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
    return user;
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

    const data: playerWithPlansData[] = [];
    for (const player of players) {
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
        display_name: player.display_name,
        age: age,
        readiness: 0,
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
}
