import { getPostgresEm } from 'server/providers/postgres';
import type { CreateReminderPayload } from './dtos/create-reminder';
import { ReminderEntity, ReminderRepeatSettings } from './entity';

export async function createReminder(payload: CreateReminderPayload) {
  const reminder = new ReminderEntity();
  reminder.title = payload.title;
  reminder.description = payload.description;

  if (payload.dueDate) {
    reminder.dueDate = new Date(payload.dueDate);
  }

  if (payload.dueTime) {
    reminder.dueTime = new Date(payload.dueTime);
  }

  if (payload.repeatSettings) {
    const repeatSettings = new ReminderRepeatSettings();

    Object.assign(repeatSettings, {
      ...payload.repeatSettings,
      repeatEndsOn: payload.repeatSettings.repeatEndsOn
        ? new Date(payload.repeatSettings.repeatEndsOn)
        : undefined
    });

    reminder.repeatSettings = repeatSettings;
  }

  await getPostgresEm().persistAndFlush(reminder);
  return reminder;
}
