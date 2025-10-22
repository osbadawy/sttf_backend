import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlannedActivityBodyRequest, PlannedActivityRecurranceDTO } from './dtos/request.dto';
import { InjectModel } from '@nestjs/sequelize';
import { PlannedActivity, PlannedActivityAssignment, PlannedActivityRecurrence } from './models';
import { User } from 'src/user/models';
import { Model } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';

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
            where: { firebase_id: { [Op.in]: users_assigned } } 
        });
        if (assigned_players.length !== users_assigned.length) {
            throw new NotFoundException('Some players not found');
        }
        return assigned_players;
    }

    private prepareAssignments(assigned_players: User[]): PlannedActivityAssignment[] {
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
            await this.plannedActivityRecurrenceModel.create({
                planned_activity_id: plannedActivityId,
                start: recurrance.start,
                end: recurrance.end,
                sun: recurrance.recurring_days.includes('sun'),
                mon: recurrance.recurring_days.includes('mon'),
                tue: recurrance.recurring_days.includes('tue'),
                wed: recurrance.recurring_days.includes('wed'),
                thu: recurrance.recurring_days.includes('thu'),
                fri: recurrance.recurring_days.includes('fri'),
                sat: recurrance.recurring_days.includes('sat'),
            } as PlannedActivityRecurrence, { transaction });
        }
    }

    private async createActivityRecords(
        plannedActivity: PlannedActivity,
        assignments: PlannedActivityAssignment[],
        recurrance: PlannedActivityRecurranceDTO | undefined,
        transaction: Transaction,
    ) {
        // Create recurrence patterns if recurring
        await this.createRecurrencePattern(plannedActivity.id, recurrance, transaction);
        // Create assignments
        await this.plannedActivityAssignmentModel.bulkCreate(
            assignments.map(assignment => ({ ...assignment, activity_id: plannedActivity.id })) as PlannedActivityAssignment[],
            { transaction }
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
    ) {}

    async createPlannedActivity({
        users_assigned,
        start,
        category,
        activity_type,
        is_custom,
        notes,
        recurrance,
    }: CreatePlannedActivityBodyRequest, 
    uid: string){

        const coach = await this.validateCoach(uid);
        const assigned_players = await this.validatePlayers(users_assigned);

        const assignments = this.prepareAssignments(assigned_players);
        const transaction = await this.plannedActivityModel.sequelize!.transaction();
        
        try {            
            const plannedActivity = await this.plannedActivityModel.create({
                start: start,
                category: category,
                activity_type: activity_type,
                is_custom: is_custom,
                notes: notes,
                assigned_by: coach.id,
            } as PlannedActivity, { transaction });

            await this.createActivityRecords(plannedActivity, assignments, recurrance,transaction);


            await transaction.commit();
            return plannedActivity;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    }

    async updatePlannedActivity(
        activityId: string,
        {
            users_assigned,
            start,
            category,
            activity_type,
            is_custom,
            notes,
            recurrance,
        }: CreatePlannedActivityBodyRequest,
        uid: string
    ) {
        const coach = await this.validateCoach(uid);
        
        // Find the existing activity
        const existingActivity = await this.plannedActivityModel.findByPk(activityId, {
            include: [
                { model: PlannedActivityAssignment },
                { model: PlannedActivityRecurrence }
            ]
        });
        if (!existingActivity) {
            throw new NotFoundException('Planned activity not found');
        }

        const assigned_players = await this.validatePlayers(users_assigned);
        const assignments = this.prepareAssignments(assigned_players);

        const transaction = await this.plannedActivityModel.sequelize!.transaction();

        try {
            // End old assignments for the selected players
            await this.plannedActivityAssignmentModel.update(
                { removed_at: new Date() },
                { 
                    where: { 
                        activity_id: activityId,
                        assigned_to: { [Op.in]: assigned_players.map(p => p.id) }
                    },
                    transaction 
                }
            );

            // Create new activity for the selected players
            const newActivity = await this.plannedActivityModel.create({
                start: start,
                category: category,
                activity_type: activity_type,
                is_custom: is_custom,
                notes: notes,
                assigned_by: coach.id,
            } as PlannedActivity, { transaction });

            await this.createActivityRecords(newActivity, assignments, recurrance,transaction);

            await transaction.commit();
            return newActivity;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
