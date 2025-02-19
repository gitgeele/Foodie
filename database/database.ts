import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite"

let db: SQLiteDatabase | null = null
let isInitialized = false

// Initialize the database
export const initDatabase = async () => {
  if (isInitialized) return

  try {
    db = await openDatabaseAsync("restaurants.db")
    if (db) {
      await db.execAsync(
        "CREATE TABLE IF NOT EXISTS saved_restaurants (id TEXT PRIMARY KEY, title TEXT, details TEXT, image TEXT)",
      )
      isInitialized = true
      console.log("Database initialized successfully")
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

// Save a restaurant
export const saveRestaurant = async (restaurant: { id: string; title: string; details: string; image: string }) => {
  if (!isInitialized) {
    await initDatabase()
  }

  if (!db) {
    throw new Error("Database not initialized")
  }

  try {
    await db.runAsync("INSERT OR REPLACE INTO saved_restaurants (id, title, details, image) VALUES (?, ?, ?, ?)", [
      restaurant.id,
      restaurant.title,
      restaurant.details,
      restaurant.image,
    ])
  } catch (error) {
    console.error("Error saving restaurant:", error)
    throw error
  }
}

// Get saved restaurants
export const getSavedRestaurants = async (): Promise<any[]> => {
  if (!isInitialized) {
    await initDatabase()
  }

  if (!db) {
    throw new Error("Database not initialized")
  }

  try {
    const result = await db.getAllAsync("SELECT * FROM saved_restaurants")
    return result
  } catch (error) {
    console.error("Error fetching saved restaurants:", error)
    throw error
  }
}

// Delete a saved restaurant
export const deleteSavedRestaurant = async (id: string) => {
  if (!isInitialized) {
    await initDatabase()
  }

  if (!db) {
    throw new Error("Database not initialized")
  }

  try {
    await db.runAsync("DELETE FROM saved_restaurants WHERE id = ?", [id])
  } catch (error) {
    console.error("Error deleting restaurant:", error)
    throw error
  }
}
