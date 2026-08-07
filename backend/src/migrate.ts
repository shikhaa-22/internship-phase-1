import pool from './config/db';

async function runMigration() {
  console.log('Starting MySQL database migration...');
  const conn = await pool.getConnection();

  try {
    // 1. Add columns to specializations table if not exists
    try {
      await conn.execute(
        "ALTER TABLE specializations ADD COLUMN seniority_level ENUM('junior', 'senior', 'lead_specialist') DEFAULT 'senior'"
      );
      console.log("Added column 'seniority_level' to specializations table.");
    } catch (_e: any) {
      console.log("Column 'seniority_level' already exists in specializations table.");
    }

    try {
      await conn.execute(
        "ALTER TABLE specializations ADD COLUMN tier_multiplier DECIMAL(3,2) DEFAULT 1.15"
      );
      console.log("Added column 'tier_multiplier' to specializations table.");
    } catch (_e: any) {
      console.log("Column 'tier_multiplier' already exists in specializations table.");
    }

    // 2. Set default fixed tiers for specializations
    await conn.execute(
      "UPDATE specializations SET seniority_level = 'junior', tier_multiplier = 1.00 WHERE name LIKE '%General Medicine%' OR name LIKE '%Fitness%' OR name LIKE '%Diet%'"
    );
    await conn.execute(
      "UPDATE specializations SET seniority_level = 'senior', tier_multiplier = 1.15 WHERE name LIKE '%Dermatology%' OR name LIKE '%Massage%' OR name LIKE '%Therapy%' OR name LIKE '%Tax%'"
    );
    await conn.execute(
      "UPDATE specializations SET seniority_level = 'lead_specialist', tier_multiplier = 1.30 WHERE name LIKE '%Cardiology%' OR name LIKE '%Legal%' OR name LIKE '%Strategy%'"
    );
    console.log("Updated specializations with fixed seniority tiers and multipliers.");

    // 3. Sync provider profiles to match their specialization's tier multiplier
    await conn.execute(
      "UPDATE provider_profiles pp JOIN specializations sp ON pp.specialization_id = sp.id SET pp.seniority_level = sp.seniority_level, pp.tier_multiplier = sp.tier_multiplier"
    );
    console.log("Synced provider profiles with specialization fixed tiers.");

    // 4. Clean up any remaining provider profile tier multipliers
    await conn.execute("UPDATE provider_profiles SET tier_multiplier = 1.00 WHERE seniority_level = 'junior'");
    await conn.execute("UPDATE provider_profiles SET tier_multiplier = 1.15 WHERE seniority_level = 'senior'");
    await conn.execute("UPDATE provider_profiles SET tier_multiplier = 1.30 WHERE seniority_level = 'lead_specialist'");
    console.log("Normalized all remaining provider profiles tier multipliers.");

    console.log("Database migration completed successfully!");
  } catch (err: any) {
    console.error("Migration error:", err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
