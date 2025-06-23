import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import type { AdapterAccount } from '@auth/core/adapters'

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// NextAuth.js tables
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const accounts = sqliteTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount['type']>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId]
  })
}))

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

export const verificationTokens = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({
    columns: [vt.identifier, vt.token]
  })
}))


export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert