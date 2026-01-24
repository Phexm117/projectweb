// ===== MySQL init =====

async function initMySql(dbPromise) {
  try {
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS login_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(255) NULL,
        user_agent TEXT NULL,
        logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_login_activity_user_id (user_id)
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        pet_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_favorites_user_pet (user_id, pet_id)
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    async function ensureColumn(columnName, columnDefinition) {
      const [columns] = await dbPromise.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = ?`,
        [columnName]
      );
      if (!columns || columns.length === 0) {
        await dbPromise.query(`ALTER TABLE users ADD COLUMN ${columnDefinition}`);
      }
    }

    await ensureColumn('password', "password VARCHAR(255) NOT NULL");
    await ensureColumn('name', "name VARCHAR(255) NULL");
    await ensureColumn('role', "role ENUM('user', 'admin') NOT NULL DEFAULT 'user'");
    await ensureColumn('created_at', "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS pets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id VARCHAR(50) NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        age_year INT NOT NULL DEFAULT 0,
        age_month INT NOT NULL DEFAULT 0,
        age_text VARCHAR(50) NULL,
        sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        post_status ENUM('open', 'close') NOT NULL DEFAULT 'open',
        color VARCHAR(50) NULL,
        details TEXT NULL,
        image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS \`delete\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id VARCHAR(50) NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        age_year INT NOT NULL DEFAULT 0,
        age_month INT NOT NULL DEFAULT 0,
        age_text VARCHAR(50) NULL,
        sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        post_status ENUM('open', 'close') NOT NULL DEFAULT 'open',
        adoption_status ENUM('available', 'unavailable', 'adopted') NOT NULL DEFAULT 'available',
        vaccinated ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        color VARCHAR(50) NULL,
        details TEXT NULL,
        image VARCHAR(255) NULL,
        image_2 VARCHAR(255) NULL,
        image_3 VARCHAR(255) NULL,
        created_at TIMESTAMP NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    async function ensurePetColumn(columnName, columnDefinition) {
      const [columns] = await dbPromise.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'pets'
           AND COLUMN_NAME = ?`,
        [columnName]
      );
      if (!columns || columns.length === 0) {
        await dbPromise.query(`ALTER TABLE pets ADD COLUMN ${columnDefinition}`);
      }
    }

    await ensurePetColumn('pet_id', "pet_id VARCHAR(50) NULL UNIQUE");
    await ensurePetColumn('age_year', "age_year INT NOT NULL DEFAULT 0");
    await ensurePetColumn('age_month', "age_month INT NOT NULL DEFAULT 0");
    await ensurePetColumn('age_text', "age_text VARCHAR(50) NULL");
    await ensurePetColumn('sterilized', "sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no'");
    await ensurePetColumn('post_status', "post_status ENUM('open', 'close') NOT NULL DEFAULT 'open'");
    await ensurePetColumn('color', "color VARCHAR(50) NULL");
    await ensurePetColumn('details', "details TEXT NULL");
    await ensurePetColumn('image', "image VARCHAR(255) NULL");
    await ensurePetColumn('image_2', "image_2 VARCHAR(255) NULL");
    await ensurePetColumn('image_3', "image_3 VARCHAR(255) NULL");
    await ensurePetColumn('adoption_status', "adoption_status ENUM('available', 'unavailable', 'adopted') NOT NULL DEFAULT 'available'");
    await ensurePetColumn('vaccinated', "vaccinated ENUM('yes', 'no') NOT NULL DEFAULT 'no'");
    await ensurePetColumn('created_at', "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      await dbPromise.query(
        `INSERT INTO users (email, password, name, role)
         VALUES (?, ?, ?, 'admin')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), role = 'admin'`,
        [adminEmail, adminPassword, process.env.ADMIN_NAME || 'admin']
      );
    }

    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;
    if (userEmail && userPassword) {
      await dbPromise.query(
        `INSERT INTO users (email, password, name, role)
         VALUES (?, ?, ?, 'user')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), role = 'user'`,
        [userEmail, userPassword, process.env.USER_NAME || 'user']
      );
    }
  } catch (err) {
    console.error('MySQL init error:', err.message);
  }
}

module.exports = {
  initMySql
};
