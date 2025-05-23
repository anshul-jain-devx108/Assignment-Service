const { db } = require("../config/firebaseConfig");

const ClassroomModel = {
  async getById(classroomId) {
    const doc = await db.collection("classrooms").doc(classroomId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
};

module.exports = ClassroomModel;
