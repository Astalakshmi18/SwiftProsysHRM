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
  const [editingRemarks, setEditingRemarks] = useState(null);
  const [remarksText, setRemarksText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

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
          remarks: item.remarks || '',
          remarksEditedAt: item.remarksEditedAt || null
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
      let totalDurationMs = 0;

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

      if (firstClockIn && lastClockOut) {
        const start = new Date(`${item.date}T${firstClockIn}`);
        const end = new Date(`${item.date}T${lastClockOut}`);
        if (!isNaN(start) && !isNaN(end)) {
          totalDurationMs = end - start;
        }
      }

      const totalHours = totalMs
        ? `${String(Math.floor(totalMs / 3600000)).padStart(2, "0")}:${String(
            Math.floor((totalMs % 3600000) / 60000)
          ).padStart(2, "0")}:${String(Math.floor((totalMs % 60000) / 1000)).padStart(2, "0")}`
        : "--:--:--";

      const totalDuration = totalDurationMs
        ? `${String(Math.floor(totalDurationMs / 3600000)).padStart(2, "0")}:${String(
            Math.floor((totalDurationMs % 3600000) / 60000)
          ).padStart(2, "0")}:${String(Math.floor((totalDurationMs % 60000) / 1000)).padStart(2, "0")}`
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
        totalDuration,
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

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      TotalActiveHours: item.totalHours,
      TotalDuration: item.totalDuration,
      Attendance: item.present,
      Remarks: item.remarks || '',
      RemarksEditedAt: item.remarksEditedAt || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = `Attendance_${selectedDate || "All"}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const startEditRemarks = (index, remarks) => {
    setEditingRemarks(index);
    setRemarksText(remarks || '');
  };

  const saveRemarks = (index) => {
    const updatedData = [...attendanceData];
    updatedData[index] = {
      ...updatedData[index],
      remarks: remarksText,
      remarksEditedAt: new Date().toISOString()
    };
    setAttendanceData(updatedData);
    setEditingRemarks(null);
    setRemarksText('');
  };

  const cancelEditRemarks = () => {
    setEditingRemarks(null);
    setRemarksText('');
  };

  return (
    <div className="container-fluid bg-gray-100 px-0">
      <div className="bg-white p-3 rounded">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h1 className="text-xl font-semibold">Daily Attendance Report</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border px-3 py-1 rounded text-sm w-full sm:w-auto"
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-1 rounded text-sm w-full sm:w-auto"
            />
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm border border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Date</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Employee ID</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Name</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Shift</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Punch In</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Punch Out</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Total Active Hours</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Total Duration</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Attendance</th>
                <th className="border px-3 py-2 text-left whitespace-nowrap">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 whitespace-nowrap">{item.date}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{item.employeeId}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{item.firstName}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">
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
                  <td className="border px-3 py-2 whitespace-nowrap">{item.firstClockIn || "--:--:--"}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{item.lastClockOut || "--:--:--"}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{item.totalHours}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{item.totalDuration}</td>
                  <td className="border px-3 py-2 font-semibold whitespace-nowrap">
                    {item.present === "Present" ? (
                      <span className="text-green-600">Present</span>
                    ) : (
                      <span className="text-red-500">Absent</span>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {editingRemarks === i ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={remarksText}
                          onChange={(e) => setRemarksText(e.target.value)}
                          className="border p-1 text-xs"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveRemarks(i)}
                            className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditRemarks}
                            className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                        {item.remarksEditedAt && (
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            Last edited: {dayjs(item.remarksEditedAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="whitespace-normal">{item.remarks || '-'}</div>
                        {item.remarksEditedAt && (
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            Edited: {dayjs(item.remarksEditedAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        )}
                        <button
                          onClick={() => startEditRemarks(i, item.remarks)}
                          className="text-blue-500 text-xs mt-1 self-start"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredData.length > recordsPerPage && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                First
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1 rounded ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Next
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}