import { tbValidator } from '$lib/typebox/hono';
import { createReminderPayloadDto } from 'features/reminder/dtos/create-reminder';
import { createReminder } from 'features/reminder/services';
import { Hono } from 'hono';

const reminderRoutes = new Hono().post(
  '/',
  tbValidator('json', createReminderPayloadDto),
  async (c) => {
    const payload = c.req.valid('json');
    const reminder = await createReminder(payload);
    return c.json(reminder);
  }
);

export default reminderRoutes;
