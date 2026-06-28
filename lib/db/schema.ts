import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`

export const restaurants = sqliteTable('restaurants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  address: text('address'),
  phone: text('phone'),
  logo: text('logo'),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('WAITER'),
  salary: real('salary'),
  hireDate: text('hire_date').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
}, (t) => ({ emailRestaurantIdx: index('employees_email_restaurant').on(t.email, t.restaurantId) }))

export const menuCategories = sqliteTable('menu_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const menuItems = sqliteTable('menu_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => menuCategories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  image: text('image'),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  allergens: text('allergens'),
  preparationTime: integer('preparation_time'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
}, (t) => ({ emailRestaurantIdx: index('customers_email_restaurant').on(t.email, t.restaurantId) }))

export const tables = sqliteTable('tables', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  capacity: integer('capacity').notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  location: text('location'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id),
  tableId: text('table_id').references(() => tables.id),
  status: text('status').notNull().default('PENDING'),
  type: text('type').notNull().default('DINE_IN'),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  paymentStatus: text('payment_status').notNull().default('PENDING'),
  paymentMethod: text('payment_method'),
  deliveryAddress: text('delivery_address'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  notes: text('notes'),
})

export const couriers = sqliteTable('couriers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  vehicleType: text('vehicle_type'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const deliveries = sqliteTable('deliveries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull().unique().references(() => orders.id),
  courierId: text('courier_id').references(() => couriers.id),
  address: text('address').notNull(),
  status: text('status').notNull().default('PENDING'),
  estimatedTime: integer('estimated_time'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id),
  tableId: text('table_id').references(() => tables.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  date: text('date').notNull(),
  duration: integer('duration').notNull().default(90),
  partySize: integer('party_size').notNull(),
  status: text('status').notNull().default('PENDING'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  quantity: real('quantity').notNull().default(0),
  minQuantity: real('min_quantity').notNull().default(0),
  costPerUnit: real('cost_per_unit'),
  supplier: text('supplier'),
  category: text('category'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const loyaltyPrograms = sqliteTable('loyalty_programs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().unique().references(() => restaurants.id, { onDelete: 'cascade' }),
  pointsPerAmount: real('points_per_amount').notNull().default(1),
  rewardThreshold: integer('reward_threshold').notNull().default(100),
  rewardValue: real('reward_value').notNull().default(10),
  rewardType: text('reward_type').notNull().default('DISCOUNT'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  category: text('category'),
  response: text('response'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})
