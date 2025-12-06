import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase.js';
import { resetDailyCredits } from '../services/user.service.js';
import { config } from '../config/index.js';

// Parse cron time (e.g., "00:00" or "00:00:00" -> "0 0 * * *")
function parseCronTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return `${minutes} ${hours} * * *`;
}

export function startDailyResetJob() {
  const cronTime = parseCronTime(config.cron.dailyResetTime);

  console.log(`Starting daily reset job at ${config.cron.dailyResetTime} (${config.cron.dailyResetTimezone})`);

  cron.schedule(cronTime, async () => {
    console.log('Running daily credit reset...');
    await runDailyReset();
  }, {
    timezone: config.cron.dailyResetTimezone,
  });
}

async function runDailyReset() {
  try {
    let offset = 0;
    const batchSize = 100;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of users
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error fetching users for reset:', error);
        break;
      }

      if (!users || users.length === 0) {
        hasMore = false;
        break;
      }

      // Reset credits for each user
      for (const user of users) {
        try {
          await resetDailyCredits(user.id);
        } catch (error) {
          console.error(`Error resetting credits for user ${user.id}:`, error);
        }
      }

      console.log(`Reset credits for ${users.length} users (offset: ${offset})`);

      offset += batchSize;
      hasMore = users.length === batchSize;
    }

    console.log('Daily reset completed');
  } catch (error) {
    console.error('Error in daily reset job:', error);
  }
}

// Also export a function to run manually
export async function runDailyResetNow() {
  await runDailyReset();
}



