import { ObjectId } from "mongodb";

async function main() {
  // parse args and allow passing mongo uri / db name via flags to avoid requiring .env
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length < 2) {
    console.error(
      "Usage: ts-node server/scripts/inspectTeacherRefs.ts <userId> <teacherCode> [--mongo <MONGO_URI>] [--db <DB_NAME>]",
    );
    process.exit(1);
  }
  const userId = rawArgs[0];
  const teacherCode = rawArgs[1];

  const mongoFlag = rawArgs.indexOf("--mongo");
  if (mongoFlag !== -1 && rawArgs[mongoFlag + 1]) {
    process.env.MONGO_URI = rawArgs[mongoFlag + 1];
  }
  const dbFlag = rawArgs.indexOf("--db");
  if (dbFlag !== -1 && rawArgs[dbFlag + 1]) {
    process.env.MONGO_DB_NAME = rawArgs[dbFlag + 1];
  }

  // import connectDB after env adjustments
  const { connectDB } = await import("../configs/db");
  const db = await connectDB();
  const classesCol = db.collection("classes");
  const teachersCol = db.collection("teachers");

  const cursor = classesCol.find({});
  const report: any[] = [];
  while (await cursor.hasNext()) {
    const cls = await cursor.next();
    if (!cls) continue; // guard: cursor.next() can be null
    const rec: any = {
      _id: cls._id,
      classCode: cls.classCode || cls.code || null,
    };

    // check top-level teacherId
    const tid = cls.teacherId;
    rec.teacherId = tid;
    rec.teacherIdType = typeof tid;
    rec.teacherIdIsObjectId = ObjectId.isValid(tid) && typeof tid !== "string";

    // If teacherId is an ObjectId, see if it points to a teacher doc
    try {
      if (tid && tid._bsontype === "ObjectID") {
        const tdoc = await teachersCol.findOne({ _id: tid });
        rec.teacherIdPointsToTeacher = !!tdoc;
        if (tdoc)
          rec.teacherDoc = {
            _id: tdoc._id,
            name: tdoc.name || tdoc.fullName || tdoc.teacherName,
          };
      } else if (typeof tid === "string") {
        rec.teacherIdMatchesUserId = tid === userId;
        rec.teacherIdMatchesTeacherCode = tid === teacherCode;
        // also check if this string can be an ObjectId that matches a teacher doc
        if (ObjectId.isValid(tid)) {
          const tdoc = await teachersCol.findOne({ _id: new ObjectId(tid) });
          rec.teacherIdPointsToTeacher = !!tdoc;
          if (tdoc)
            rec.teacherDoc = {
              _id: tdoc._id,
              name: tdoc.name || tdoc.fullName || tdoc.teacherName,
            };
        }
      }
    } catch (err) {
      rec.teacherIdPointsToTeacher = false;
      rec._err = String(err);
    }

    // check subjectTeachers
    rec.subjectTeachers = [];
    if (Array.isArray(cls.subjectTeachers)) {
      for (const st of cls.subjectTeachers) {
        const srec: any = { subject: st.subject || st.name || st.subjectName };
        const sid = st.teacherId;
        srec.teacherId = sid;
        if (sid && sid._bsontype === "ObjectID") {
          const tdoc = await teachersCol.findOne({ _id: sid });
          srec.pointsToTeacher = !!tdoc;
          if (tdoc)
            srec.teacherDoc = {
              _id: tdoc._id,
              name: tdoc.name || tdoc.fullName,
            };
        } else if (typeof sid === "string") {
          srec.matchesUserId = sid === userId;
          srec.matchesTeacherCode = sid === teacherCode;
          if (ObjectId.isValid(sid)) {
            const tdoc = await teachersCol.findOne({ _id: new ObjectId(sid) });
            srec.pointsToTeacher = !!tdoc;
            if (tdoc)
              srec.teacherDoc = {
                _id: tdoc._id,
                name: tdoc.name || tdoc.fullName,
              };
          }
        }
        rec.subjectTeachers.push(srec);
      }
    }

    // if any match or pointsToTeacher true, include in report
    const interesting =
      rec.teacherIdMatchesUserId ||
      rec.teacherIdMatchesTeacherCode ||
      rec.teacherIdPointsToTeacher ||
      rec.subjectTeachers.some(
        (st: any) =>
          st.matchesUserId || st.matchesTeacherCode || st.pointsToTeacher,
      );
    if (interesting) report.push(rec);
  }

  const outPath = "server/scripts/inspectTeacherRefs.report.json";
  const fs = require("fs");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        queriedUserId: userId,
        queriedTeacherCode: teacherCode,
        results: report,
        count: report.length,
      },
      null,
      2,
    ),
  );
  console.log("Report written to", outPath, "matches:", report.length);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
