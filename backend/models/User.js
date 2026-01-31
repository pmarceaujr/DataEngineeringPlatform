/**
 * User Model
 * Represents users in the system
 * 
 * Key concepts:
    UUID: Unique identifier that's impossible to guess (better than simple numbers)
    ENUM: Restricts values to a specific list
    timestamps: true: Sequelize automatically tracks when records are created/updated
    validate: Ensures data meets requirements before saving
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,                     // UUID = Universal Unique ID (looks like: 123e4567-e89b-12d3-a456-426614174000)
      defaultValue: DataTypes.UUIDV4,           // Auto-generate UUID
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,                         // Required field
      unique: true,                             // No two users can have same email
      validate: {
        isEmail: true                           // Must be valid email format
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'engineer', 'analyst', 'viewer'),  // Only these values allowed
      defaultValue: 'engineer'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,                           // Automatically adds createdAt and updatedAt fields
    tableName: 'users'
  });

  return User;
};