import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompleteMealRequest,
  CreateMealBodyRequest,
  GetMealsByDateRangeQuery,
  GetMealsParams,
  MealCompletionDTO,
  MealRecurrenceDTO,
  UnassignMealBodyRequest,
  UpdateMealBodyRequest,
} from './dtos/request.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Meal, MealAssignment, MealResults, MealRecurrence } from './models';
import { User } from 'src/user/models';
import { Op, Transaction } from 'sequelize';
import { DailyPointsService } from 'src/user/services/daily_points.service';

@Injectable()
export class MealService {
  private async validateUser(uid: string) {
    const user = await this.userModel.findOne({ where: { firebase_id: uid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async validatePlayers(users_assigned: string[]) {
    const assigned_players = await this.userModel.findAll({
      where: { firebase_id: { [Op.in]: users_assigned } },
    });
    if (assigned_players.length !== users_assigned.length) {
      throw new NotFoundException('Some players not found');
    }
    return assigned_players;
  }

  private prepareAssignments(assigned_players: User[]): MealAssignment[] {
    const assignments: MealAssignment[] = [];
    for (let i = 0; i < assigned_players.length; i++) {
      assignments.push({
        assigned_to: assigned_players[i].id,
        assigned_at: new Date(),
      } as MealAssignment);
    }
    return assignments;
  }

  private async createRecurrencePattern(
    mealId: string,
    recurrance: MealRecurrenceDTO | undefined,
    transaction: Transaction,
  ) {
    if (recurrance) {
      await this.mealRecurrenceModel.create(
        {
          meal_id: mealId,
          start: recurrance.start,
          end: recurrance.end,
          sun: recurrance.recurring_days.includes('sun'),
          mon: recurrance.recurring_days.includes('mon'),
          tue: recurrance.recurring_days.includes('tue'),
          wed: recurrance.recurring_days.includes('wed'),
          thu: recurrance.recurring_days.includes('thu'),
          fri: recurrance.recurring_days.includes('fri'),
          sat: recurrance.recurring_days.includes('sat'),
        } as MealRecurrence,
        { transaction },
      );
    }
  }

  private async createMealRecords(
    meal: Meal,
    assignments: MealAssignment[],
    transaction: Transaction,
    recurrance?: MealRecurrenceDTO,
    completion?: MealCompletionDTO,
    completion_firebase_id?: string,
  ) {
    // Create recurrence patterns if recurring
    await this.createRecurrencePattern(meal.id, recurrance, transaction);
    // Create assignments
    const mealAssignments = await this.mealAssignmentModel.bulkCreate(
      assignments.map((assignment) => ({
        ...assignment,
        meal_id: meal.id,
      })) as MealAssignment[],
      { transaction },
    );

    if (completion && completion.is_completed && completion_firebase_id) {
      await this.mealResultsModel.bulkCreate(
        mealAssignments.map((ma) => {
          return {
            assignment_id: ma.id,
            img_url: completion.img_url,
            points_assigned: 20,
          } as MealResults;
        }),
        { transaction },
      );

      await this.dailyPointsService.updateDailyPointsForUser(
        completion_firebase_id,
        20,
        new Date(),
        transaction,
      );
    }
  }

  constructor(
    @InjectModel(Meal)
    private readonly mealModel: typeof Meal,
    @InjectModel(MealAssignment)
    private readonly mealAssignmentModel: typeof MealAssignment,
    @InjectModel(MealRecurrence)
    private readonly mealRecurrenceModel: typeof MealRecurrence,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(MealResults)
    private readonly mealResultsModel: typeof MealResults,
    private readonly dailyPointsService: DailyPointsService,
  ) {}

  async createMeal(
    {
      users_assigned,
      start,
      category,
      name,
      kilojoule,
      protein,
      carbohydrates,
      fat,
      is_planned,
      recurrance,
      amount,
      amount_unit,
      completion,
    }: CreateMealBodyRequest,
    uid: string,
  ) {
    const assigned_by_user = await this.validateUser(uid);
    const assigned_players = await this.validatePlayers(users_assigned);

    const assignments = this.prepareAssignments(assigned_players);
    const transaction = await this.mealModel.sequelize!.transaction();

    try {
      const meal = await this.mealModel.create(
        {
          start: start,
          category: category,
          name: name,
          kilojoule: kilojoule,
          protein: protein,
          carbohydrates: carbohydrates,
          fat: fat,
          is_planned: is_planned,
          amount: amount,
          amount_unit: amount_unit,
          assigned_by: assigned_by_user.id,
        } as Meal,
        { transaction },
      );

      await this.createMealRecords(
        meal,
        assignments,
        transaction,
        recurrance,
        completion,
        assigned_by_user.firebase_id,
      );

      await transaction.commit();

      // Return the created meal with all related data
      return await this.mealModel.findByPk(meal.id, {
        include: [
          {
            model: MealAssignment,
            include: [
              {
                model: User,
                attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
              },
              {
                model: MealResults,
                required: false,
              },
            ],
          },
          { model: MealRecurrence },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateMeal(
    {
      id,
      users_assigned,
      start,
      category,
      name,
      kilojoule,
      protein,
      carbohydrates,
      fat,
      is_planned,
      recurrance,
      day,
      amount,
      amount_unit,
      completion,
    }: UpdateMealBodyRequest,
    uid: string,
  ) {
    const assigned_by_user = await this.validateUser(uid);

    // Find the existing activity
    const existingActivity = await this.mealModel.findByPk(id, {
      include: [{ model: MealAssignment }, { model: MealRecurrence }],
    });
    if (!existingActivity) {
      throw new NotFoundException('Planned meal not found');
    }

    const assigned_players = await this.validatePlayers(users_assigned);
    const assignments = this.prepareAssignments(assigned_players);

    const transaction = await this.mealModel.sequelize!.transaction();

    try {
      // End old assignments for the selected players
      const endOfPrevDay = new Date(day);
      endOfPrevDay.setDate(endOfPrevDay.getDate() - 1);
      endOfPrevDay.setHours(23, 59, 59, 999);

      await this.mealAssignmentModel.update(
        { removed_at: endOfPrevDay },
        {
          where: {
            meal_id: id,
            assigned_to: { [Op.in]: assigned_players.map((p) => p.id) },
          },
          transaction,
        },
      );

      // Create new activity for the selected players
      const newActivity = await this.mealModel.create(
        {
          start: start,
          category: category,
          name: name,
          kilojoule: kilojoule,
          protein: protein,
          carbohydrates: carbohydrates,
          fat: fat,
          is_planned: is_planned,
          amount: amount,
          amount_unit: amount_unit,
          assigned_by: assigned_by_user.id,
        } as Meal,
        { transaction },
      );

      await this.createMealRecords(
        newActivity,
        assignments,
        transaction,
        recurrance,
        completion,
        assigned_by_user.firebase_id,
      );

      await transaction.commit();
      // Return the created meal with all related data
      return await this.mealModel.findByPk(newActivity.id, {
        include: [
          {
            model: MealAssignment,
            include: [
              {
                model: User,
                attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
              },
              {
                model: MealResults,
                required: false,
              },
            ],
          },
          { model: MealRecurrence },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async unassignPlayersFromMeal({
    id,
    users_assigned,
    day,
  }: UnassignMealBodyRequest) {
    const assigned_players = await this.validatePlayers(users_assigned);

    const endOfPrevDay = new Date(day);
    endOfPrevDay.setDate(endOfPrevDay.getDate() - 1);
    endOfPrevDay.setHours(23, 59, 59, 999);

    await this.mealAssignmentModel.update(
      { removed_at: endOfPrevDay },
      {
        where: {
          meal_id: id,
          assigned_to: { [Op.in]: assigned_players.map((p) => p.id) },
        },
      },
    );

    return {
      message: 'Players unassigned from meal successfully',
    };
  }

  async getMeals({
    startDate,
    endDate,
    dayOfWeek,
    users_assigned,
  }: GetMealsParams) {
    const assignedPlayers = await this.validatePlayers(users_assigned);
    const assignedPlayerIds = assignedPlayers.map((player) => player.id);

    // Build the where conditions for both one-time and recurring activities
    const whereConditions: any[] = [];

    // Condition 1: One-time activities within the date range
    whereConditions.push({
      start: { [Op.gte]: startDate, [Op.lte]: endDate },
      '$recurrence_patterns.id$': { [Op.is]: null }, // No recurrence pattern
    });

    // Condition 2: Recurring activities that match the day of week
    const recurringCondition: Record<string, any> = {
      '$recurrence_patterns.id$': { [Op.ne]: null }, // Has recurrence pattern
      '$recurrence_patterns.start$': { [Op.lte]: endDate }, // Recurrence started before or on this day
      [Op.or]: [
        { '$recurrence_patterns.end$': { [Op.gte]: startDate } }, // Recurrence ends after or on this day
        { '$recurrence_patterns.end$': { [Op.is]: null } }, // Recurrence has no end date (continues indefinitely)
      ],
    };
    // Only add day of week condition if dayOfWeek is defined
    if (dayOfWeek !== undefined) {
      recurringCondition[`$recurrence_patterns.${dayOfWeek}$`] = true; // Matches the day of week
    }
    whereConditions.push(recurringCondition);

    const meals = await this.mealModel.findAll({
      where: {
        [Op.or]: whereConditions,
        // Use a subquery to filter meals where the specified players are assigned
        id: {
          [Op.in]: this.mealAssignmentModel.sequelize!.literal(`(
            SELECT DISTINCT meal_id 
            FROM meal_assignment 
            WHERE assigned_to IN (${assignedPlayerIds.map(() => '?').join(',')})
            AND (removed_at IS NULL OR removed_at > ?)
          )`),
        },
      },
      replacements: [...assignedPlayerIds, endDate],
      include: [
        {
          model: MealAssignment,
          include: [
            {
              model: User,
              attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
            },
            {
              model: MealResults,
              required: false,
              where: { createdAt: { [Op.gte]: startDate, [Op.lte]: endDate } },
            },
          ],
        },
        { model: MealRecurrence },
      ],
    });
    return meals;
  }

  async getMealById(id: string) {
    return await this.mealModel.findByPk(id, {
      include: [
        {
          model: MealAssignment,
          include: [
            {
              model: User,
              attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
            },
          ],
        },
        { model: MealRecurrence },
      ],
    });
  }

  async completeMeal(
    { img_url, id }: CompleteMealRequest,
    firebase_id: string,
  ) {
    console.log('firebase_id', firebase_id);
    const players = await this.validatePlayers([firebase_id]);
    console.log('player', players[0]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const assignment = await this.mealAssignmentModel.findOne({
      where: {
        assigned_to: players[0].id,
        meal_id: id,
      },
      include: [
        {
          model: MealResults,
          required: false,
          where: { createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } },
        },
      ],
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.completions && assignment.completions.length > 0) {
      throw new BadRequestException('Meal already reviewed today');
    }

    const points_assigned = 20;
    const transaction = await this.mealModel.sequelize!.transaction();
    try {
      const mealResults = await this.mealResultsModel.create(
        {
          img_url: img_url,
          assignment_id: assignment.id,
          points_assigned: points_assigned,
        } as MealResults,
        { transaction },
      );

      // Update daily points for the player
      await this.dailyPointsService.updateDailyPointsForUser(
        firebase_id,
        points_assigned,
        new Date(),
        transaction,
      );

      await transaction.commit();
      return mealResults;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getCompletedMealsByDateRange({
    startDate,
    endDate,
    firebase_id,
  }: GetMealsByDateRangeQuery) {
    const assigned_player = await this.validateUser(firebase_id);
    const meals = await this.mealModel.findAll({
      include: [
        {
          model: MealAssignment,
          where: {
            assigned_to: assigned_player.id,
          },
          include: [
            {
              model: MealResults,
              required: true,
              where: { createdAt: { [Op.gte]: startDate, [Op.lte]: endDate } },
              order: [['createdAt', 'DESC']],
            },
          ],
        },
      ],
    });
    return meals;
  }
}
