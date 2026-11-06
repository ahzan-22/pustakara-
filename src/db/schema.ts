import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  serial,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// --- ENUMS ---
export const roleEnum = pgEnum("role", ["admin", "member"]);
export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "approved",
  "rejected",
  "borrowed",
  "returned",
  "overdue",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "hidden",
  "deleted",
]);

// --- TABLES ---
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // Terhubung ke auth.users.id Supabase
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  role: roleEnum("role").default("member").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 20 }).unique(),
  publisher: varchar("publisher", { length: 255 }),
  year: integer("year"),
  synopsis: text("synopsis"),
  coverUrl: text("cover_url"),
  categoryId: integer("category_id").references(() => categories.id),
  totalCopies: integer("total_copies").default(1).notNull(),
  availableCopies: integer("available_copies").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), 
  bookId: uuid("book_id").references(() => books.id).notNull(),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  status: loanStatusEnum("status").default("pending").notNull(),
  fineAmount: integer("fine_amount").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    bookId: uuid("book_id").references(() => books.id).notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    isSpoiler: boolean("is_spoiler").default(false),
    isVerified: boolean("is_verified").default(false),
    likeCount: integer("like_count").default(0),
    status: reviewStatusEnum("status").default("published").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      // 1 user hanya bisa review 1 buku 1 kali
      userBookUnique: uniqueIndex("user_book_unique_idx").on(table.userId, table.bookId), 
    };
  }
);

export const wishlists = pgTable(
  "wishlists",
  {
    userId: uuid("user_id").notNull(),
    bookId: uuid("book_id").references(() => books.id).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.bookId] }),
    };
  }
);