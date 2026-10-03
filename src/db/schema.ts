import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { PlantGuide } from "@/plants/types";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // Location
  locationName: text("location_name"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  timezone: text("timezone"),
  countryCode: text("country_code"),

  // Climate (estimated, user-overridable)
  hardinessZone: text("hardiness_zone"),
  lastFrost: text("last_frost"), // "MM-DD"
  firstFrost: text("first_frost"), // "MM-DD"
  frostFree: boolean("frost_free").notNull().default(false),
  chillHours: integer("chill_hours"),

  // Preferences
  units: text("units", { enum: ["imperial", "metric"] }).notNull().default("imperial"),
  treatmentPreference: text("treatment_preference", { enum: ["organic", "both"] }).notNull().default("both"),
  weeklyEmail: boolean("weekly_email").notNull().default(true),
});

export const loginTokens = pgTable(
  "login_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [index("login_tokens_email_idx").on(t.email, t.createdAt)],
);

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** AI-written guides for plants that aren't in the curated library, shared by everyone. */
export const customGuides = pgTable("custom_guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  normalizedName: text("normalized_name").notNull().unique(),
  guide: jsonb("guide").$type<PlantGuide>().notNull(),
  model: text("model").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gardenPlants = pgTable(
  "garden_plants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Curated library key, or null when using a custom guide. */
    plantKey: text("plant_key"),
    customGuideId: uuid("custom_guide_id").references(() => customGuides.id),
    nickname: text("nickname"),
    quantity: integer("quantity").notNull().default(1),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("garden_plants_user_idx").on(t.userId)],
);

export const taskCompletions = pgTable(
  "task_completions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** See occurrenceKey() in lib/schedule.ts. */
    occurrenceKey: text("occurrence_key").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.occurrenceKey] })],
);

export const emailLog = pgTable(
  "email_log",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Local date of the Friday the digest was for, "YYYY-MM-DD". */
    weekOf: text("week_of").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("email_log_user_week").on(t.userId, t.weekOf)],
);

export type User = typeof users.$inferSelect;
export type GardenPlant = typeof gardenPlants.$inferSelect;
