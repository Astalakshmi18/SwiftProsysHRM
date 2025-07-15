import React, { useEffect, useState } from "react";
import useAttendance from "../../hooks/useAttendance";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import * as XLSX from "xlsx";

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function AttendanceTable() {
  const { getAllAttendance } = useAttendance();
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const prepareAttendanceData = (rawData) => {
    const grouped = {};

    rawData.forEach((item) => {
      const employeeId = item.employeeId?.trim().toLowerCase();
      const firstName = item.firstName?.trim().toLowerCase();
      const date = dayjs(item.date).format("YYYY-MM-DD");
      const key = `${employeeId}-${firstName}-${date}`;

      if (!grouped[key]) {
        grouped[key] = {
          employeeId: item.employeeId?.trim(),
          firstName: item.firstName?.trim(),
          date,
          shift: item.shift,
          tracker: [],
        };
      }

      grouped[key].tracker.push(...(item.tracker || []));
    });

    return Object.values(grouped).map((item) => {
      const sorted = item.tracker
        .filter((t) => t.clockIn || t.clockOut)
        .sort(
          (a, b) =>
            new Date(`${item.date}T${a.clockIn || a.clockOut}`) -
            new Date(`${item.date}T${b.clockIn || b.clockOut}`)
        );

      let totalMs = 0;
      let firstClockIn = null;
      let lastClockOut = null;

      sorted.forEach(({ clockIn, clockOut }) => {
        if (clockIn && !firstClockIn) firstClockIn = clockIn;
        if (clockOut) lastClockOut = clockOut;

        if (clockIn && clockOut) {
          const inTime = new Date(`${item.date}T${clockIn}`);
          const outTime = new Date(`${item.date}T${clockOut}`);
          if (!isNaN(inTime) && !isNaN(outTime) && outTime > inTime) {
            totalMs += outTime - inTime;
          }
        }
      });

      const totalHours = totalMs
        ? `${String(Math.floor(totalMs / 3600000)).padStart(2, "0")}:${String(
            Math.floor((totalMs % 3600000) / 60000)
          ).padStart(2, "0")}:${String(Math.floor((totalMs % 60000) / 1000)).padStart(2, "0")}`
        : "--:--:--";

      const shift = item.shift?.toLowerCase();
      const shiftTimes = {
        general: ["08:30", "09:00", "09:30", "10:00"],
        "shift-1": ["06:00", "07:00"],
        "shift-2": ["13:00", "14:00"],
      }[shift];

      let status = "Unknown";
      if (firstClockIn && shiftTimes) {
        const clockInTime = dayjs(`${item.date} ${firstClockIn}`, "YYYY-MM-DD HH:mm:ss");
        const isOnTime = shiftTimes.some((shiftStr) => {
          const shiftStart = dayjs(`${item.date} ${shiftStr}`, "YYYY-MM-DD HH:mm");
          const graceStart = shiftStart.subtract(10, "minute");
          const graceEnd = shiftStart.add(5, "minute");
          return (
            clockInTime.isSameOrAfter(graceStart) &&
            clockInTime.isSameOrBefore(graceEnd)
          );
        });
        status = isOnTime ? "On time" : "Late";
      }

      return {
        ...item,
        firstClockIn,
        lastClockOut,
        totalHours,
        status,
        present: totalHours >= "06:00:00" ? "Present" : "Absent",
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await getAllAttendance();
        const enriched = prepareAttendanceData(records);
        setAttendanceData(enriched);
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      }
    };

    fetchData();
  }, [getAllAttendance]);

  const filteredData = attendanceData.filter((item) => {
    const matchesDate = selectedDate ? item.date === selectedDate : true;
    const matchesSearch = searchQuery
      ? item.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesSearch;
  });

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert("No data found for selected date!");
      return;
    }

    const sheetData = filteredData.map((item) => ({
      Date: item.date,
      EmployeeID: item.employeeId,
      Name: item.firstName,
      Shift: item.shift,
      Status: item.status,
      ClockIn: item.firstClockIn || "--:--:--",
      ClockOut: item.lastClockOut || "--:--:--",
      TotalHours: item.totalHours,
      Attendance: item.present,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = `Attendance_${selectedDate || "All"}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="container-fluid bg-gray-100 px-0">
      <div className="bg-white p-3 rounded">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Daily Attendance Report</h1>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border px-3 py-1 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-1 rounded text-sm"
            />
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600"
            >
              Export Excel
            </button>
          </div>
        </div>

        <table className="w-full table-auto text-sm border border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Employee ID</th>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Shift</th>
              <th className="border px-3 py-2 text-left">Punch In</th>
              <th className="border px-3 py-2 text-left">Punch Out</th>
              <th className="border px-3 py-2 text-left">Total Active Hours</th>
              <th className="border px-3 py-2 text-left">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{item.date}</td>
                <td className="border px-3 py-2">{item.employeeId}</td>
                <td className="border px-3 py-2">{item.firstName}</td>
                <td className="border px-3 py-2">
                  <div className="flex justify-between items-center">
                    <span>{item.shift}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-white text-xs ${
                        item.status === "Late" ? "bg-red-500" : "bg-blue-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </td>
                <td className="border px-3 py-2">{item.firstClockIn || "--:--:--"}</td>
                <td className="border px-3 py-2">{item.lastClockOut || "--:--:--"}</td>
                <td className="border px-3 py-2">{item.totalHours}</td>
                <td className="border px-3 py-2 font-semibold">
                  {item.present === "Present" ? (
                    <span className="text-green-600">Present</span>
                  ) : (
                    <span className="text-red-500">Absent</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
