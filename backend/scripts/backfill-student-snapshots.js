require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Application = require("../src/models/Application");
const DriveRegistration = require("../src/models/DriveRegistration");
const Placement = require("../src/models/Placement");
const Student = require("../src/models/Student");
const { buildStudentSnapshot } = require("../src/utils/studentSnapshot");

async function backfillCollection(Model, label) {
  const docs = await Model.find({
    $or: [
      { studentSnapshot: { $exists: false } },
      { "studentSnapshot.name": { $in: [null, ""] } }
    ]
  }).select("_id student");

  let updated = 0;

  for (const doc of docs) {
    const student = await Student.findById(doc.student).lean();
    if (!student) continue;

    await Model.updateOne(
      { _id: doc._id },
      { $set: { studentSnapshot: buildStudentSnapshot(student) } }
    );
    updated += 1;
  }

  console.log(`${label}: ${updated} updated`);
}

async function run() {
  await connectDB();
  await backfillCollection(Application, "Applications");
  await backfillCollection(DriveRegistration, "Drive registrations");
  await backfillCollection(Placement, "Placements");
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
