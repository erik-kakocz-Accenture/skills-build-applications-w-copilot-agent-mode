import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function ensureObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be an object.');
  }
  return input as Record<string, unknown>;
}

function normalizeObjectId(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    throw new HttpError(400, `${fieldName} is required.`);
  }
  const text = String(value);
  if (!mongoose.Types.ObjectId.isValid(text)) {
    throw new HttpError(400, `Invalid ${fieldName}.`);
  }
  return new mongoose.Types.ObjectId(text);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = ensureObject(input);
  const userId = normalizeObjectId(body.userId ?? body.user, 'userId');
  const teamId = normalizeObjectId(body.teamId ?? body.team, 'teamId');

  const type = typeof body.type === 'string' ? body.type.trim() : '';
  if (!type) {
    throw new HttpError(400, 'Activity type is required.');
  }

  const minutesValue = Number(body.minutes);
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw new HttpError(400, 'Activity minutes must be a positive number.');
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const team = await Team.findById(teamId).lean();
  if (!team) {
    throw new HttpError(404, 'Team not found.');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = ensureObject(input);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';

  if (!name) {
    throw new HttpError(400, 'Team name is required.');
  }

  if (!mascot) {
    throw new HttpError(400, 'Team mascot is required.');
  }

  const rawMembers = Array.isArray(body.members) ? body.members : [];
  const members = rawMembers.map((member) => normalizeObjectId(member, 'team member'));

  for (const memberId of members) {
    const user = await User.findById(memberId).lean();
    if (!user) {
      throw new HttpError(404, 'Team member not found.');
    }
  }

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNameById = new Map<string, string>(
    teams.map((team) => [String(team._id), team.name]),
  );

  return totals.map((entry, index) => ({
    teamName: teamNameById.get(String(entry._id)) ?? 'Unknown team',
    totalPoints: Number(entry.totalPoints) || 0,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!email) {
    throw new HttpError(400, 'User email is required.');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ? String(recentActivities[0].type) : '';
  const preferredFocus = String(user.fitnessGoal ?? recentType ?? '').trim();

  const workouts = await Workout.find().sort({ focus: 1, title: 1 }).lean();
  const matching = workouts.filter((workout) => String(workout.focus).toLowerCase() === preferredFocus.toLowerCase());
  const rest = workouts.filter((workout) => String(workout.focus).toLowerCase() !== preferredFocus.toLowerCase());

  const suggestions = [...matching, ...rest].map((workout) => {
    const activityContext = recentType ? `recent ${recentType} activity` : 'recent activity';
    const goalContext = preferredFocus ? `goal: ${preferredFocus}` : 'your current goals';
    const reason = `Matches your ${activityContext} and fitness ${goalContext}.`;
    return {
      ...workout,
      reason,
    };
  });

  return suggestions;
}

export { User };
