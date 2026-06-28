import { pgTable, text, integer, real, boolean, index } from 'drizzle-orm/pg-core'

const nowIso = () => new Date().toISOString()

export const restaurants = pgTable('restaurants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  address: text('address'),
  phone: text('phone'),
  logo: text('logo'),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const employees = pgTable('employees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('WAITER'),
  salary: real('salary'),
  hireDate: text('hire_date').notNull().$defaultFn(nowIso),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
}, (t) => ({ emailRestaurantIdx: index('employees_email_restaurant').on(t.email, t.restaurantId) }))

export const menuCategories = pgTable('menu_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => menuCategories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  image: text('image'),
  isAvailable: boolean('is_available').notNull().default(true),
  allergens: text('allergens'),
  preparationTime: integer('preparation_time'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
}, (t) => ({ emailRestaurantIdx: index('customers_email_restaurant').on(t.email, t.restaurantId) }))

export const tables = pgTable('tables', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  capacity: integer('capacity').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  location: text('location'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const orders = pgTable('orders', {
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
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  notes: text('notes'),
})

export const couriers = pgTable('couriers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  vehicleType: text('vehicle_type'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const deliveries = pgTable('deliveries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull().unique().references(() => orders.id),
  courierId: text('courier_id').references(() => couriers.id),
  address: text('address').notNull(),
  status: text('status').notNull().default('PENDING'),
  estimatedTime: integer('estimated_time'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const reservations = pgTable('reservations', {
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
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  quantity: real('quantity').notNull().default(0),
  minQuantity: real('min_quantity').notNull().default(0),
  costPerUnit: real('cost_per_unit'),
  supplier: text('supplier'),
  category: text('category'),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const loyaltyPrograms = pgTable('loyalty_programs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().unique().references(() => restaurants.id, { onDelete: 'cascade' }),
  pointsPerAmount: real('points_per_amount').notNull().default(1),
  rewardThreshold: integer('reward_threshold').notNull().default(100),
  rewardValue: real('reward_value').notNull().default(10),
  rewardType: text('reward_type').notNull().default('DISCOUNT'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})

export const staffInviteCodes = pgTable('staff_invite_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  role: text('role').notNull(),
  label: text('label'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
})

export const feedback = pgTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  category: text('category'),
  response: text('response'),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso),
})
