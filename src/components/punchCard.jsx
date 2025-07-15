import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import useAuth from "../hooks/useAuth";
import useAttendance from "../hooks/useAttendance";
import { projects } from "../constant/data";
import { updateDoc, doc, collection, addDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const AUTO_PUNCH_OUT_DELAY = 1 * 60 * 1000;
const ITEMS_PER_PAGE = 5;

const ClockInDashboard = () => {
  const { user } = useAuth();
  const { storeAttendance, getEmployeeAttendance } = useAttendance();
  const idleTimer = useRef(null);

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredDate, setFilteredDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const resetSession = () => {
    localStorage.removeItem("attendanceSession");
    setIsClockedIn(false);
    setStartTime(null);
    setElapsedTime(null);
    setEndTime(dayjs());
  };

  const fetchAttendance = async () => {
    if (!user?.employeeid) return;
    const records = await getEmployeeAttendance(user.employeeid);
    const sorted = [...records].sort((a, b) =>
      dayjs(b.createdAt?.toDate?.() || b.createdAt).valueOf() -
      dayjs(a.createdAt?.toDate?.() || a.createdAt).valueOf()
    );
    setAttendanceData(sorted);
  };

  const punchOut = async (reason = "—", type = "manual") => {
    const now = dayjs();
    const today = now.format("YYYY-MM-DD");
    const formattedTime = now.format("HH:mm:ss");

    const freshAttendance = await getEmployeeAttendance(user.employeeid);
    const sorted = [...freshAttendance].sort((a, b) =>
      dayjs(b.createdAt?.toDate?.() || b.createdAt).valueOf() -
      dayjs(a.createdAt?.toDate?.() || a.createdAt).valueOf()
    );

    const todayRecord = sorted.find(r => r.date === today);
    if (!todayRecord || !todayRecord.tracker || !todayRecord.id) return;

    const trackerIndex = todayRecord.tracker.findIndex(t => t.clockOut === "--:--:--");
    if (trackerIndex === -1) return;

    const updatedTracker = [...todayRecord.tracker];
    updatedTracker[trackerIndex].clockOut = formattedTime;
    updatedTracker[trackerIndex].reason = type === "auto" ? reason : "—";
    updatedTracker[trackerIndex].type = type;

    const docRef = doc(db, "attendance", todayRecord.id);
    await updateDoc(docRef, { tracker: updatedTracker });

    resetSession();
    await fetchAttendance();
  };

  const handleClockIn = async () => {
    const now = dayjs();
    const formattedTime = now.format("HH:mm:ss");
    const today = now.format("YYYY-MM-DD");

    if (!user?.employeeid) return alert("User not found.");
    if (!selectedProject || !selectedShift) return alert("Select project and shift.");

    if (!isClockedIn) {
      const payload = {
        employeeId: user.employeeid,
        firstName: user.firstName,
        project: selectedProject,
        date: today,
        shift: selectedShift,
        tracker: [{ clockIn: formattedTime, clockOut: "--:--:--", reason: "—", type: "manual" }],
        createdAt: new Date(),
      };

      await storeAttendance(payload);
      localStorage.setItem("attendanceSession", JSON.stringify({
        isClockedIn: true,
        startTime: now.toISOString()
      }));

      setStartTime(now);
      setIsClockedIn(true);
      setElapsedTime(0);
      setEndTime(null);
      await fetchAttendance();
    } else {
      const confirmOut = confirm("You are already clocked in. Punch out?");
      if (confirmOut) await punchOut("—", "manual");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("attendanceSession");
    if (saved) {
      const { isClockedIn, startTime } = JSON.parse(saved);
      const parsed = dayjs(startTime);
      const now = dayjs();

      if (now.diff(parsed, "hour") < 24) {
        setIsClockedIn(isClockedIn);
        setStartTime(parsed);
        setElapsedTime(now.diff(parsed, "second"));
      } else {
        resetSession();
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isClockedIn && startTime) {
      timer = setInterval(() => {
        setElapsedTime(dayjs().diff(startTime, "second"));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, startTime]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  useEffect(() => {
    const resetIdleTimer = () => {
      if (!isClockedIn || endTime) return;
      if (idleTimer.current) clearTimeout(idleTimer.current);

      idleTimer.current = setTimeout(async () => {
        setElapsedTime(null);
        const reason = prompt("\uD83D\uDD52 Inactivity detected. Please provide a reason:");
        if (reason) await punchOut(reason, "auto");
      }, AUTO_PUNCH_OUT_DELAY);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isClockedIn, endTime]);

  const formatElapsed = (sec) => {
    if (sec == null) return "--:--:--";
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleLeaveSubmit = async () => {
    if (!leaveReason.trim()) return alert("❗Enter a reason");
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      await addDoc(collection(db, "leaveApplications"), {
        employeeId: user.employeeid,
        name: user.firstName,
        reason: leaveReason,
        project: userData?.project || selectedProject || "unknown",
        date: new Date(),
        status: "Pending",
      });
      alert("✅ Leave application sent.");
      setLeaveReason("");
      setShowLeaveModal(false);
    } catch {
      alert("❌ Failed to send leave application.");
    }
  };

  const filteredData = filteredDate
    ? attendanceData.filter((d) => d.date === filteredDate)
    : attendanceData;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-[90%] max-w-md">
            <h3 className="text-lg font-bold mb-2">Apply Leave</h3>
            <textarea
              rows={4}
              className="w-full border p-2 rounded"
              placeholder="Enter reason for leave..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowLeaveModal(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={handleLeaveSubmit} className="px-3 py-1 bg-blue-500 text-white rounded">Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white rounded shadow-sm p-4">
          <h2 className="text-blue-500 font-bold">Hi {user?.firstName || "Guest"}!</h2>
          <p className="text-xs text-gray-500">Please check your attendance...</p>
          <p className="text-[45px] text-center font-bold text-orange-400">
            {formatElapsed(elapsedTime)}
          </p>
          <button onClick={() => setShowLeaveModal(true)} className="mt-4 w-full border border-blue-500 text-blue-500 py-2 rounded hover:bg-blue-500 hover:text-white">
            Apply Leave
          </button>
        </div>

        <div className="bg-white rounded shadow-sm p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700">Attendance</h4>
            <div className="flex gap-2">
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="border rounded px-3 py-1 text-sm">
                <option value="">Select Shift</option>
                <option value="Shift-1">Shift 1</option>
                <option value="General">General</option>
                <option value="Shift-2">Shift 2</option>
              </select>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="border rounded px-3 py-1 text-sm">
                <option value="">Select Project</option>
                {projects.map((dept) => (
                  <option key={dept.key} value={dept.key}>{dept.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between my-2">
            <div>
              <p className="text-xs text-gray-400">Start Time</p>
              <p className="text-lg">{startTime ? startTime.format("HH:mm:ss") : "--:--:--"}</p>
              <p className="text-sm text-gray-600">{currentTime.format("dddd, DD MMMM YYYY")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">End Time</p>
              <p className="text-lg">{endTime ? endTime.format("HH:mm:ss") : "--:--:--"}</p>
            </div>
          </div>

          <div className="w-full">
            {!isClockedIn || !endTime ? (
              <button onClick={handleClockIn} className="w-full border border-blue-500 text-blue-500 py-2 rounded hover:bg-blue-500 hover:text-white">
                {isClockedIn ? "Punch Out" : "Punch In"}
              </button>
            ) : (
              <p className="text-center text-gray-500">You clocked out at {endTime.format("HH:mm:ss")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm mt-2 p-4">
        <div className="flex justify-between mb-2">
          <h5 className="text-gray-700 font-semibold">Recent Attendance</h5>
          <input
            type="date"
            value={filteredDate}
            onChange={(e) => {
              setFilteredDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-3 py-1 text-sm rounded"
          />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">S.No.</th>
                <th className="p-2">Project</th>
                <th className="p-2">Date</th>
                <th className="p-2">Shift</th>
                <th className="p-2">Punch In</th>
                <th className="p-2">Punch Out</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record, index) => {
                  const last = record.tracker[record.tracker.length - 1];
                  return (
                    <tr key={index} className="border-t">
                      <td className="p-2">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-2">{record.project}</td>
                      <td className="p-2">{record.date}</td>
                      <td className="p-2">{record.shift}</td>
                      <td className="p-2">{last?.clockIn || "--:--:--"}</td>
                      <td className="p-2">{last?.clockOut || "--:--:--"}</td>
                      <td className="p-2">{last?.clockOut !== "--:--:--" ? last?.reason || "—" : "—"}</td>
                      <td className="p-2">{last?.clockOut !== "--:--:--" ? last?.type || "manual" : "—"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-2 text-center text-gray-500 italic">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-3 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInDashboard;
