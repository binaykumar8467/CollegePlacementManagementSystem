require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Student = require("../src/models/Student");

const emptyStringFields = [
  "rollNo",
  "department",
  "year",
  "resumeLink",
  "gradingSystem",
  "resumeFile",
  "resumeFileName",
  "resumeMimeType",
  "profilePhotoFile",
  "profilePhotoFileName",
  "profilePhotoMimeType",
  "approvalNote"
];

const nullableFields = [
  "cgpa",
  "percentage",
  "class10Percentage",
  "class12Percentage",
  "resumeData",
  "profilePhotoData"
];

const emptyArrayFields = ["skills", "semesterPercentages"];

// Handle the unset empty field logic used in this file.
async function unsetEmptyField(field, emptyValue) {
  const result = await Student.updateMany(
    { [field]: emptyValue },
    { $unset: { [field]: "" } }
  );
  return result.modifiedCount || 0;
}

// Handle the run logic used in this file.
async function run() {
  await connectDB();
  let updatedFields = 0;

  for (const field of emptyStringFields) {
    updatedFields += await unsetEmptyField(field, "");
  }

  for (const field of nullableFields) {
    updatedFields += await unsetEmptyField(field, null);
  }

  for (const field of emptyArrayFields) {
    updatedFields += await unsetEmptyField(field, []);
  }

  console.log(`Empty student fields cleaned: ${updatedFields}`);
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
