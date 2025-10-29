import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompletePlannedActivityRequest,
  CreatePlannedActivityBodyRequest,
  GetPlannedActivitiesParams,
  PlannedActivityRecurranceDTO,
  UnassignPlannedActivityBodyRequest,
  UpdatePlannedActivityBodyRequest,
} from './dtos/request.dto';
import { InjectModel } from '@nestjs/sequelize';
import {
  PlannedActivity,
  PlannedActivityAssignment,
  PlannedActivityPerformance,
  PlannedActivityRecurrence,
} from './models';
import { User } from 'src/user/models';
import { Op, Transaction } from 'sequelize';
import { DailyPointsService } from 'src/user/services/daily_points.service';

@Injectable()
export class PlannedActivityService {
  private async validateCoach(uid: string) {
    const coach = await this.userModel.findOne({ where: { firebase_id: uid } });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }
    return coach;
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

  private prepareAssignments(
    assigned_players: User[],
  ): PlannedActivityAssignment[] {
    const assignments: PlannedActivityAssignment[] = [];
    for (let i = 0; i < assigned_players.length; i++) {
      assignments.push({
        assigned_to: assigned_players[i].id,
        assigned_at: new Date(),
      } as PlannedActivityAssignment);
    }
    return assignments;
  }

  private async createRecurrencePattern(
    plannedActivityId: string,
    recurrance: PlannedActivityRecurranceDTO | undefined,
    transaction: Transaction,
  ) {
    if (recurrance) {
      await this.plannedActivityRecurrenceModel.create(
        {
          planned_activity_id: plannedActivityId,
          start: recurrance.start,
          end: recurrance.end ?? null,
          sun: recurrance.recurring_days.includes('sun'),
          mon: recurrance.recurring_days.includes('mon'),
          tue: recurrance.recurring_days.includes('tue'),
          wed: recurrance.recurring_days.includes('wed'),
          thu: recurrance.recurring_days.includes('thu'),
          fri: recurrance.recurring_days.includes('fri'),
          sat: recurrance.recurring_days.includes('sat'),
        } as PlannedActivityRecurrence,
        { transaction },
      );
    }
  }

  private async createActivityRecords(
    plannedActivity: PlannedActivity,
    assignments: PlannedActivityAssignment[],
    recurrance: PlannedActivityRecurranceDTO | undefined,
    transaction: Transaction,
  ) {
    // Create recurrence patterns if recurring
    await this.createRecurrencePattern(
      plannedActivity.id,
      recurrance,
      transaction,
    );
    // Create assignments
    await this.plannedActivityAssignmentModel.bulkCreate(
      assignments.map((assignment) => ({
        ...assignment,
        activity_id: plannedActivity.id,
      })) as PlannedActivityAssignment[],
      { transaction },
    );
  }

  constructor(
    @InjectModel(PlannedActivity)
    private readonly plannedActivityModel: typeof PlannedActivity,
    @InjectModel(PlannedActivityAssignment)
    private readonly plannedActivityAssignmentModel: typeof PlannedActivityAssignment,
    @InjectModel(PlannedActivityRecurrence)
    private readonly plannedActivityRecurrenceModel: typeof PlannedActivityRecurrence,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(PlannedActivityPerformance)
    private readonly plannedActivityPerformanceModel: typeof PlannedActivityPerformance,
    private readonly dailyPointsService: DailyPointsService,
  ) {}

  async createPlannedActivity(
    {
      users_assigned,
      start,
      category,
      activity_type,
      is_custom,
      notes,
      recurrance,
    }: CreatePlannedActivityBodyRequest,
    uid: string,
  ) {
    const coach = await this.validateCoach(uid);
    const assigned_players = await this.validatePlayers(users_assigned);

    const assignments = this.prepareAssignments(assigned_players);
    const transaction =
      await this.plannedActivityModel.sequelize!.transaction();

    try {
      const plannedActivity = await this.plannedActivityModel.create(
        {
          start: start,
          category: category,
          activity_type: activity_type,
          is_custom: is_custom,
          notes: notes,
          assigned_by: coach.id,
        } as PlannedActivity,
        { transaction },
      );

      await this.createActivityRecords(
        plannedActivity,
        assignments,
        recurrance,
        transaction,
      );

      await transaction.commit();

      // Return the created activity with all related data
      return await this.plannedActivityModel.findByPk(plannedActivity.id, {
        include: [
          {
            model: PlannedActivityAssignment,
            include: [
              {
                model: User,
                attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
              },
              {
                model: PlannedActivityPerformance,
                required: false,
              },
            ],
          },
          { model: PlannedActivityRecurrence },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updatePlannedActivity(
    {
      id,
      users_assigned,
      start,
      category,
      activity_type,
      is_custom,
      notes,
      recurrance,
      day,
    }: UpdatePlannedActivityBodyRequest,
    uid: string,
  ) {
    const coach = await this.validateCoach(uid);

    // Find the existing activity
    const existingActivity = await this.plannedActivityModel.findByPk(id, {
      include: [
        { model: PlannedActivityAssignment },
        { model: PlannedActivityRecurrence },
      ],
    });
    if (!existingActivity) {
      throw new NotFoundException('Planned activity not found');
    }

    const assigned_players = await this.validatePlayers(users_assigned);
    const assignments = this.prepareAssignments(assigned_players);

    const transaction =
      await this.plannedActivityModel.sequelize!.transaction();

    try {
      // End old assignments for the selected players
      const endOfPrevDay = new Date(day);
      endOfPrevDay.setDate(endOfPrevDay.getDate() - 1);
      endOfPrevDay.setHours(23, 59, 59, 999);

      await this.plannedActivityAssignmentModel.update(
        { removed_at: endOfPrevDay },
        {
          where: {
            activity_id: id,
            assigned_to: { [Op.in]: assigned_players.map((p) => p.id) },
          },
          transaction,
        },
      );

      // Create new activity for the selected players
      const newActivity = await this.plannedActivityModel.create(
        {
          start: start,
          category: category,
          activity_type: activity_type,
          is_custom: is_custom,
          notes: notes,
          assigned_by: coach.id,
        } as PlannedActivity,
        { transaction },
      );

      await this.createActivityRecords(
        newActivity,
        assignments,
        recurrance,
        transaction,
      );

      await transaction.commit();

      // Return the created activity with all related data
      return await this.plannedActivityModel.findByPk(newActivity.id, {
        include: [
          {
            model: PlannedActivityAssignment,
            include: [
              {
                model: User,
                attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
              },
              {
                model: PlannedActivityPerformance,
                required: false,
              },
            ],
          },
          { model: PlannedActivityRecurrence },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async unassignPlayersFromPlannedActivity({
    id,
    users_assigned,
    day,
  }: UnassignPlannedActivityBodyRequest) {
    const assigned_players = await this.validatePlayers(users_assigned);

    const endOfPrevDay = new Date(day);
    endOfPrevDay.setDate(endOfPrevDay.getDate() - 1);
    endOfPrevDay.setHours(23, 59, 59, 999);

    await this.plannedActivityAssignmentModel.update(
      { removed_at: endOfPrevDay },
      {
        where: {
          activity_id: id,
          assigned_to: { [Op.in]: assigned_players.map((p) => p.id) },
        },
      },
    );

    return {
      message: 'Players unassigned from planned activity successfully',
    };
  }

  async getPlannedActivities({
    startDate,
    endDate,
    dayOfWeek,
    users_assigned,
    onlyMatchSelectedPlayers = false,
  }: GetPlannedActivitiesParams) {
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

    const plannedActivities = await this.plannedActivityModel.findAll({
      where: {
        [Op.or]: whereConditions,
        // Use a subquery to filter activities where the specified players are assigned
        id: {
          [Op.in]: this.plannedActivityAssignmentModel.sequelize!.literal(`(
            SELECT DISTINCT activity_id 
            FROM planned_activity_assignment 
            WHERE assigned_to IN (${assignedPlayerIds.map(() => '?').join(',')})
            AND (removed_at IS NULL OR removed_at > ?)
          )`),
        },
      },
      replacements: [...assignedPlayerIds, endDate],
      include: [
        {
          model: PlannedActivityAssignment,
          where: onlyMatchSelectedPlayers
            ? { assigned_to: { [Op.in]: assignedPlayerIds } }
            : undefined,
          include: [
            {
              model: User,
              attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
            },
            {
              model: PlannedActivityPerformance,
              required: false,
              where: { createdAt: { [Op.gte]: startDate, [Op.lte]: endDate } },
            },
          ],
        },
        { model: PlannedActivityRecurrence },
      ],
    });
    return plannedActivities;
  }

  async getPlannedActivityById(id: string) {
    return await this.plannedActivityModel.findByPk(id, {
      include: [
        {
          model: PlannedActivityAssignment,
          include: [
            {
              model: User,
              attributes: ['id', 'firebase_id', 'display_name', 'avatar_url'],
            },
          ],
        },
        { model: PlannedActivityRecurrence },
      ],
    });
  }

  async completePlannedActivity(
    { self_assessment_score, id }: CompletePlannedActivityRequest,
    firebase_id: string,
  ) {
    console.log('firebase_id', firebase_id);
    const players = await this.validatePlayers([firebase_id]);
    console.log('player', players[0]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const assignment = await this.plannedActivityAssignmentModel.findOne({
      where: {
        assigned_to: players[0].id,
        activity_id: id,
      },
      include: [
        {
          model: PlannedActivityPerformance,
          required: false,
          where: { createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } },
        },
      ],
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.completions && assignment.completions.length > 0) {
      throw new BadRequestException('Planned activity already reviewed today');
    }

    const points_assigned = 20;
    const transaction =
      await this.plannedActivityModel.sequelize!.transaction();
    try {
      const plannedActivityPerformance =
        await this.plannedActivityPerformanceModel.create(
          {
            self_assessment_score: self_assessment_score,
            assignment_id: assignment.id,
            points_assigned: points_assigned,
          } as PlannedActivityPerformance,
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
      return plannedActivityPerformance;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
