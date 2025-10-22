import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlannedActivityBodyRequest } from './dtos/request.dto';
import { InjectModel } from '@nestjs/sequelize';
import { PlannedActivity, PlannedActivityItem, PlannedActivityAssignment, PlannedActivityRecurrence } from './models';
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

    private prepareActivityItems(activity_items: string[]): PlannedActivityItem[] {
        const items: PlannedActivityItem[] = [];
        for (let i = 0; i < activity_items.length; i++) {
            items.push({
                item_index: i,
                activity_type: activity_items[i],
            } as PlannedActivityItem);
        }
        return items;
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
        recurring_days: string[], 
        transaction: Transaction
    ) {
        if (recurring_days && recurring_days.length > 0) {
            const recurrenceData = {
                planned_activity_id: plannedActivityId,
                sun: false,
                mon: false,
                tue: false,
                wed: false,
                thu: false,
                fri: false,
                sat: false,
            };

            // Set the appropriate days to true based on the input array
            recurring_days.forEach(day => {
                if (recurrenceData.hasOwnProperty(day)) {
                    recurrenceData[day] = true;
                }
            });

            await this.plannedActivityRecurrenceModel.create(recurrenceData as PlannedActivityRecurrence, { transaction });
        }
    }

    private async createActivityRecords(
        plannedActivity: PlannedActivity,
        items: PlannedActivityItem[],
        assignments: PlannedActivityAssignment[],
        recurring_days: string[],
        transaction: Transaction
    ) {
        // Create recurrence patterns if recurring
        await this.createRecurrencePattern(plannedActivity.id, recurring_days, transaction);

        // Create activity items
        await this.plannedActivityItemModel.bulkCreate(
            items.map(item => ({ ...item, activity_id: plannedActivity.id })) as PlannedActivityItem[],
            { transaction }
        );

        // Create assignments
        await this.plannedActivityAssignmentModel.bulkCreate(
            assignments.map(assignment => ({ ...assignment, activity_id: plannedActivity.id })) as PlannedActivityAssignment[],
            { transaction }
        );
    }

    constructor(
        @InjectModel(PlannedActivity)
        private readonly plannedActivityModel: typeof PlannedActivity,
        @InjectModel(PlannedActivityItem)
        private readonly plannedActivityItemModel: typeof PlannedActivityItem,
        @InjectModel(PlannedActivityAssignment)
        private readonly plannedActivityAssignmentModel: typeof PlannedActivityAssignment,
        @InjectModel(PlannedActivityRecurrence)
        private readonly plannedActivityRecurrenceModel: typeof PlannedActivityRecurrence,
        @InjectModel(User)
        private readonly userModel: typeof User,
    ) {}

    async createPlannedActivity({
        users_assigned,
        starts_at,
        ends_at,
        notes,
        category,
        category_is_custom,
        recurring_days,
        activity_items,
    }: CreatePlannedActivityBodyRequest, 
    uid: string){

        const coach = await this.validateCoach(uid);
        const assigned_players = await this.validatePlayers(users_assigned);

        const items = this.prepareActivityItems(activity_items);
        const assignments = this.prepareAssignments(assigned_players);


        const transaction = await this.plannedActivityModel.sequelize!.transaction();
        
        try {            
            const plannedActivity = await this.plannedActivityModel.create({
                assigned_by: coach.id,
                notes: notes,
                category: category,
                category_is_custom: category_is_custom,

                start_date: new Date(starts_at),
                end_date: new Date(ends_at),
            } as PlannedActivity, { transaction });

            await this.createActivityRecords(plannedActivity, items, assignments, recurring_days || [], transaction);

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
            starts_at,
            ends_at,
            notes,
            category,
            category_is_custom,
            recurring_days,
            activity_items,
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
        
        const items = this.prepareActivityItems(activity_items);
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
                assigned_by: coach.id,
                notes: notes,
                category: category,
                category_is_custom: category_is_custom,
                start_date: new Date(starts_at),
                end_date: new Date(ends_at),
            } as PlannedActivity, { transaction });

            await this.createActivityRecords(newActivity, items, assignments, recurring_days || [], transaction);

            await transaction.commit();
            return newActivity;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
