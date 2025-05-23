

const { db } = require("../config/firebaseConfig");

const AssignmentModel = {
  /**
   * Creates a new assignment document with a createdAt timestamp.
   * @param {Object} data - Assignment data including new structure fields (e.g., tasks array).
   * @returns {Promise<Object>} - The created assignment object with its generated id.
   */
  async create(data) {
    const timestamp = new Date().toISOString();
    const assignmentData = { 
      ...data, 
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const docRef = await db.collection("assignments").add(assignmentData);
    return { id: docRef.id, ...assignmentData };
  },

  /**
   * Retrieves an assignment by its document id.
   * @param {string} id - The assignment document id.
   * @returns {Promise<Object|null>} - The assignment data or null if not found.
   */
  async getById(id) {
    const doc = await db.collection("assignments").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  /**
   * Retrieves assignments filtered by classroom id.
   * @param {string} classroomId - The classroom id.
   * @returns {Promise<Array>} - Array of assignment objects.
   */
  async getByClassroom(classroomId) {
    const snapshot = await db.collection("assignments")
      .where("classroomId", "==", classroomId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Updates an assignment document with new data and sets an updatedAt timestamp.
   * @param {string} id - The assignment document id.
   * @param {Object} updatedData - The data to update.
   * @returns {Promise<void>}
   */
  async update(id, updatedData) {
    updatedData.updatedAt = new Date().toISOString();
    await db.collection("assignments").doc(id).update(updatedData);
  },

  /**
   * Deletes an assignment document.
   * @param {string} id - The assignment document id.
   * @returns {Promise<void>}
   */
  async delete(id) {
    await db.collection("assignments").doc(id).delete();
  },
};

module.exports = AssignmentModel;
