import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Users,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import supabase from "../../api/supabase";
import { useAuth } from "../../contexts/AuthContext";

const SPACES = [
  { id: "all", label: "전체" },
  { id: "makeup", label: "메이크업실" },
  { id: "skincare", label: "스킨케어실" },
  { id: "room1", label: "ROOM 1" },
  { id: "room2", label: "ROOM 2" },
];

const REAL_SPACES = SPACES.filter((space) => space.id !== "all");

const INITIAL_RESERVATIONS = [
  {
    id: 1,
    date: "2026-08-19",
    title: "메이크업 신규교육",
    purpose: "신규교육",
    spaces: ["makeup"],
    start: "09:00",
    end: "13:00",
    owner: "장유진",
    people: 10,
    details: "",
  },
  {
    id: 2,
    date: "2026-08-19",
    title: "퍼스널컬러 이론교육",
    purpose: "내부교육",
    spaces: ["room1", "room2"],
    start: "14:00",
    end: "17:00",
    owner: "교육팀",
    people: 16,
    details: "",
  },
  {
    id: 3,
    date: "2026-08-19",
    title: "스킨케어 내부교육",
    purpose: "내부교육",
    spaces: ["skincare"],
    start: "10:30",
    end: "12:30",
    owner: "교육팀",
    people: 8,
    details: "",
  },
  {
    id: 4,
    date: "2026-08-20",
    title: "메이크업 내부교육",
    purpose: "내부교육",
    spaces: ["makeup"],
    start: "13:00",
    end: "17:00",
    owner: "교육팀",
    people: 10,
    details: "",
  },
  {
    id: 5,
    date: "2026-08-21",
    title: "서비스 교육",
    purpose: "내부교육",
    spaces: ["room1"],
    start: "10:00",
    end: "12:00",
    owner: "교육팀",
    people: 8,
    details: "",
  },
];

const START_HOUR = 7;
const END_HOUR = 24;
const HOUR_HEIGHT = 78;

const DAY_NAMES = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

function normalizeDate(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function getMonday(date) {
  const result = normalizeDate(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + diff
  );

  return result;
}

function getWeekDays(date) {
  const monday = getMonday(date);

  return Array.from(
    { length: 5 },
    (_, index) => {
      const day = new Date(monday);

      day.setDate(
        monday.getDate() + index
      );

      return day;
    }
  );
}

function timeToMinutes(time) {
  const [hour, minute] = time
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function getTop(time) {
  return (
    ((timeToMinutes(time) -
      START_HOUR * 60) /
      60) *
    HOUR_HEIGHT
  );
}

function getHeight(start, end) {
  const duration =
    timeToMinutes(end) -
    timeToMinutes(start);

  return Math.max(
    (duration / 60) *
      HOUR_HEIGHT,
    54
  );
}

function getSpaceLabel(spaceId) {
  return (
    SPACES.find(
      (space) =>
        space.id === spaceId
    )?.label || spaceId
  );
}

function formatSelectedDate(date) {
  return `${
    date.getMonth() + 1
  }월 ${date.getDate()}일 (${
    DAY_NAMES[date.getDay()]
  })`;
}

function formatShortDate(date) {
  return `${
    date.getMonth() + 1
  }.${date.getDate()}`;
}

function createTimeOptions() {
  const result = [];

  for (
    let hour = START_HOUR;
    hour <= END_HOUR;
    hour += 1
  ) {
    result.push(
      `${String(hour).padStart(
        2,
        "0"
      )}:00`
    );

    if (hour !== END_HOUR) {
      result.push(
        `${String(hour).padStart(
          2,
          "0"
        )}:30`
      );
    }
  }

  return result;
}

const TIME_OPTIONS =
  createTimeOptions();

function TimeDropdown({
  value,
  onChange,
  getUnavailable,
  disabled = false,
  unavailableLabel = "예약됨",
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`beautylab-time-select ${disabled ? "disabled" : ""}`}>
      <button
        type="button"
        className="beautylab-time-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value}</span>
        <ChevronRight
          size={16}
          className={open ? "open" : ""}
        />
      </button>

      {open && !disabled && (
        <>
          <button
            type="button"
            className="beautylab-time-select-backdrop"
            aria-label="시간 선택 닫기"
            onClick={() => setOpen(false)}
          />

          <div className="beautylab-time-select-menu">
            {TIME_OPTIONS.map((time) => {
              const unavailable = getUnavailable(time);
              const selected = value === time;

              return (
                <button
                  type="button"
                  key={time}
                  disabled={unavailable}
                  className={[
                    "beautylab-time-option",
                    selected ? "selected" : "",
                    unavailable ? "unavailable" : "available",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (unavailable) return;
                    onChange(time);
                    setOpen(false);
                  }}
                >
                  <span>{time}</span>

                  <small>
                    {unavailable ? unavailableLabel : "예약 가능"}
                  </small>

                  {selected && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function BeautyLab() {
  const { user, isAuthLoading } = useAuth();

  const currentUserId = user?.id || null;

  const currentUserName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  // 운영진 판별:
  // Supabase app_metadata / user_metadata에 role: "admin" 또는 is_admin: true가 있으면 운영진으로 처리합니다.
  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin" ||
    user?.app_metadata?.is_admin === true ||
    user?.user_metadata?.is_admin === true;

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(new Date());

  const [
    selectedSpace,
    setSelectedSpace,
  ] = useState("all");

  const [
    calendarOpen,
    setCalendarOpen,
  ] = useState(false);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(new Date());

const [reservations, setReservations] = useState([]);

  const [
    reservationOpen,
    setReservationOpen,
  ] = useState(false);

  const [
    reservationError,
    setReservationError,
  ] = useState("");

  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState(null);

  const [
    detailOpen,
    setDetailOpen,
  ] = useState(false);

  const [
    editMode,
    setEditMode,
  ] = useState(false);

  const [
    editError,
    setEditError,
  ] = useState("");

  const [
    editForm,
    setEditForm,
  ] = useState({
    spaces: [],
    title: "",
    purpose: "내부교육",
    start: "09:00",
    end: "10:00",
    owner: "",
    people: 1,
    details: "",
  });

  const [
    reservationForm,
    setReservationForm,
  ] = useState({
    spaces: [],
    title: "",
    purpose: "내부교육",
    start: "09:00",
    end: "10:00",
    owner: "장유진",
    people: 1,
    details: "",
  });

  const today =
    normalizeDate(new Date());

  const bookingLimitDate =
    new Date(today);

  bookingLimitDate.setDate(
    today.getDate() + 14
  );

  const selectedDay =
    normalizeDate(selectedDate);

  const isPastDate =
    selectedDay < today;

  const isBeyondBookingLimit =
    selectedDay >
    bookingLimitDate;

  const isBookableDate =
    !isPastDate &&
    !isBeyondBookingLimit;

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from("beauty_lab_reservations")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("예약 불러오기 실패:", error);
      setReservationError(
        "예약 정보를 불러오는 중 오류가 발생했습니다."
      );
      return;
    }

    const normalized = (data || []).map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      purpose: item.purpose || "",
      spaces: item.spaces || [],
      start: item.start_time,
      end: item.end_time,
      owner: item.owner,
      people: item.people || 1,
      details: item.details || "",
      createdBy: item.created_by || null,
    }));

    setReservations(normalized);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const weekDays =
    getWeekDays(selectedDate);

  const selectedDateKey =
    toDateKey(selectedDate);

  const reservationsForDate =
    useMemo(() => {
      return reservations.filter(
        (reservation) =>
          reservation.date ===
          selectedDateKey
      );
    }, [
      reservations,
      selectedDateKey,
    ]);

  const visibleReservations =
    useMemo(() => {
      if (
        selectedSpace === "all"
      ) {
        return reservationsForDate;
      }

      return reservationsForDate.filter(
        (reservation) =>
          reservation.spaces.includes(
            selectedSpace
          )
      );
    }, [
      selectedSpace,
      reservationsForDate,
    ]);

  const moveWeek = (
    direction
  ) => {
    const next =
      new Date(selectedDate);

    next.setDate(
      next.getDate() +
        direction * 7
    );

    setSelectedDate(next);
  };

  const openCalendar = () => {
    setCalendarMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
    );

    setCalendarOpen(true);
  };

  const selectCalendarDate = (
    date
  ) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const calendarDays =
    useMemo(() => {
      const year =
        calendarMonth.getFullYear();

      const month =
        calendarMonth.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );

      const startDay =
        firstDay.getDay();

      const days = [];

      for (
        let i = 0;
        i < startDay;
        i += 1
      ) {
        days.push(null);
      }

      for (
        let day = 1;
        day <=
        lastDay.getDate();
        day += 1
      ) {
        days.push(
          new Date(
            year,
            month,
            day
          )
        );
      }

      return days;
    }, [calendarMonth]);

  const timelineHours =
    Array.from(
      {
        length:
          END_HOUR -
          START_HOUR +
          1,
      },
      (_, index) =>
        START_HOUR + index
    );

  const openReservation = () => {
    if (!currentUserId || isAuthLoading) {
      return;
    }

    if (!isBookableDate) {
      return;
    }

    setReservationError("");

    setReservationForm({
      spaces:
        selectedSpace !== "all"
          ? [selectedSpace]
          : [],
      title: "",
      purpose: "내부교육",
      start: "09:00",
      end: "10:00",
      owner: currentUserName,
      people: 1,
      details: "",
    });

    setReservationOpen(true);
  };

  const toggleReservationSpace = (
    spaceId
  ) => {
    setReservationError("");

    setReservationForm(
      (prev) => {
        const alreadySelected =
          prev.spaces.includes(
            spaceId
          );

        return {
          ...prev,
          spaces: alreadySelected
            ? prev.spaces.filter(
                (id) =>
                  id !== spaceId
              )
            : [
                ...prev.spaces,
                spaceId,
              ],
        };
      }
    );
  };

  const isTimeOccupiedForSpaces = (time, selectedSpaces, ignoreReservationId = null, dateKey = selectedDateKey) => {
    if (!selectedSpaces || selectedSpaces.length === 0) return false;

    const minute = timeToMinutes(time);

    return reservations.some((reservation) => {
      if (reservation.id === ignoreReservationId) return false;
      if (reservation.date !== dateKey) return false;

      const sharedSpace = reservation.spaces.some((space) =>
        selectedSpaces.includes(space)
      );

      if (!sharedSpace) return false;

      return (
        minute >= timeToMinutes(reservation.start) &&
        minute < timeToMinutes(reservation.end)
      );
    });
  };

  const isEndTimeUnavailable = (
    time,
    startTime,
    selectedSpaces,
    ignoreReservationId = null,
    dateKey = selectedDateKey
  ) => {
    const endMinute = timeToMinutes(time);
    const startMinute = timeToMinutes(startTime);

    if (endMinute <= startMinute) return true;

    return reservations.some((reservation) => {
      if (reservation.id === ignoreReservationId) return false;
      if (reservation.date !== dateKey) return false;

      const sharedSpace = reservation.spaces.some((space) =>
        selectedSpaces.includes(space)
      );

      if (!sharedSpace) return false;

      const existingStart = timeToMinutes(reservation.start);
      const existingEnd = timeToMinutes(reservation.end);

      return startMinute < existingEnd && endMinute > existingStart;
    });
  };

  const hasConflict = () => {
    const newStart =
      timeToMinutes(
        reservationForm.start
      );

    const newEnd =
      timeToMinutes(
        reservationForm.end
      );

    return reservations.some(
      (reservation) => {
        if (
          reservation.date !==
          selectedDateKey
        ) {
          return false;
        }

        const sharedSpace =
          reservation.spaces.some(
            (space) =>
              reservationForm.spaces.includes(
                space
              )
          );

        if (!sharedSpace) {
          return false;
        }

        const existingStart =
          timeToMinutes(
            reservation.start
          );

        const existingEnd =
          timeToMinutes(
            reservation.end
          );

        return (
          newStart <
            existingEnd &&
          newEnd >
            existingStart
        );
      }
    );
  };

  const getConflictReservations =
    () => {
      const newStart =
        timeToMinutes(
          reservationForm.start
        );

      const newEnd =
        timeToMinutes(
          reservationForm.end
        );

      return reservations.filter(
        (reservation) => {
          if (
            reservation.date !==
            selectedDateKey
          ) {
            return false;
          }

          const sharedSpace =
            reservation.spaces.some(
              (space) =>
                reservationForm.spaces.includes(
                  space
                )
            );

          if (!sharedSpace) {
            return false;
          }

          const existingStart =
            timeToMinutes(
              reservation.start
            );

          const existingEnd =
            timeToMinutes(
              reservation.end
            );

          return (
            newStart <
              existingEnd &&
            newEnd >
              existingStart
          );
        }
      );
    };

  const submitReservation = async (event) => {
    event.preventDefault();

    setReservationError("");

    if (reservationForm.spaces.length === 0) {
      setReservationError(
        "사용할 공간을 1개 이상 선택해주세요."
      );
      return;
    }

    if (!reservationForm.title.trim()) {
      setReservationError(
        "예약명을 입력해주세요."
      );
      return;
    }

    if (
      timeToMinutes(reservationForm.start) >=
      timeToMinutes(reservationForm.end)
    ) {
      setReservationError(
        "종료 시간은 시작 시간보다 늦어야 합니다."
      );
      return;
    }

    if (!reservationForm.owner.trim()) {
      setReservationError(
        "예약자를 입력해주세요."
      );
      return;
    }

    if (Number(reservationForm.people) < 1) {
      setReservationError(
        "사용 인원을 확인해주세요."
      );
      return;
    }

    if (hasConflict()) {
      const conflicts =
        getConflictReservations();

      const conflictText = conflicts
        .map((reservation) => {
          const shared = reservation.spaces
            .filter((space) =>
              reservationForm.spaces.includes(space)
            )
            .map(getSpaceLabel)
            .join(", ");

          return `${shared} ${reservation.start}-${reservation.end}`;
        })
        .join(" / ");

      setReservationError(
        `이미 예약된 시간이 있습니다. ${conflictText}`
      );

      return;
    }

    const { data, error } = await supabase
      .from("beauty_lab_reservations")
      .insert([
        {
          date: selectedDateKey,
          title: reservationForm.title.trim(),
          purpose: reservationForm.purpose,
          spaces: reservationForm.spaces,
          start_time: reservationForm.start,
          end_time: reservationForm.end,
          owner: currentUserName || reservationForm.owner.trim(),
          created_by: currentUserId,
          people: Number(reservationForm.people),
          details: reservationForm.details.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("예약 등록 실패:", error);
      setReservationError(
        "예약 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    const savedReservation = {
      id: data.id,
      date: data.date,
      title: data.title,
      purpose: data.purpose || "",
      spaces: data.spaces || [],
      start: data.start_time,
      end: data.end_time,
      owner: data.owner,
      people: data.people || 1,
      details: data.details || "",
      createdBy: data.created_by || currentUserId,
    };

    setReservations((prev) => [
      ...prev,
      savedReservation,
    ]);

    setReservationOpen(false);
    setReservationError("");
  };

  const openReservationDetail = (reservation) => {
    setSelectedReservation(reservation);
    setEditMode(false);
    setEditError("");

    setEditForm({
      spaces: [...reservation.spaces],
      title: reservation.title || "",
      purpose: reservation.purpose || "내부교육",
      start: reservation.start,
      end: reservation.end,
      owner: reservation.owner || "",
      people: reservation.people || 1,
      details: reservation.details || "",
    });

    setDetailOpen(true);
  };

  const closeReservationDetail = () => {
    setDetailOpen(false);
    setEditMode(false);
    setEditError("");
    setSelectedReservation(null);
  };

  const toggleEditSpace = (spaceId) => {
    setEditError("");

    setEditForm((prev) => {
      const alreadySelected = prev.spaces.includes(spaceId);

      return {
        ...prev,
        spaces: alreadySelected
          ? prev.spaces.filter((id) => id !== spaceId)
          : [...prev.spaces, spaceId],
      };
    });
  };

  const getEditConflicts = () => {
    if (!selectedReservation) return [];

    const newStart = timeToMinutes(editForm.start);
    const newEnd = timeToMinutes(editForm.end);

    return reservations.filter((reservation) => {
      if (reservation.id === selectedReservation.id) {
        return false;
      }

      if (reservation.date !== selectedReservation.date) {
        return false;
      }

      const sharedSpace = reservation.spaces.some((space) =>
        editForm.spaces.includes(space)
      );

      if (!sharedSpace) {
        return false;
      }

      const existingStart = timeToMinutes(reservation.start);
      const existingEnd = timeToMinutes(reservation.end);

      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const saveReservationEdit = async (event) => {
    event.preventDefault();

    if (!selectedReservation) return;

    if (
      !currentUserId ||
      (!isAdmin && selectedReservation.createdBy !== currentUserId)
    ) {
      setEditError("본인이 등록한 예약만 수정할 수 있습니다.");
      setEditMode(false);
      return;
    }

    setEditError("");

    if (editForm.spaces.length === 0) {
      setEditError("사용할 공간을 1개 이상 선택해주세요.");
      return;
    }

    if (!editForm.title.trim()) {
      setEditError("예약명을 입력해주세요.");
      return;
    }

    if (
      timeToMinutes(editForm.start) >=
      timeToMinutes(editForm.end)
    ) {
      setEditError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    if (!editForm.owner.trim()) {
      setEditError("예약자를 입력해주세요.");
      return;
    }

    if (Number(editForm.people) < 1) {
      setEditError("사용 인원을 확인해주세요.");
      return;
    }

    const conflicts = getEditConflicts();

    if (conflicts.length > 0) {
      const conflictText = conflicts
        .map((reservation) => {
          const shared = reservation.spaces
            .filter((space) => editForm.spaces.includes(space))
            .map(getSpaceLabel)
            .join(", ");

          return `${shared} ${reservation.start}-${reservation.end}`;
        })
        .join(" / ");

      setEditError(`이미 예약된 시간이 있습니다. ${conflictText}`);
      return;
    }

    const { data, error } = await supabase
      .from("beauty_lab_reservations")
      .update({
        title: editForm.title.trim(),
        purpose: editForm.purpose,
        spaces: editForm.spaces,
        start_time: editForm.start,
        end_time: editForm.end,
        owner: editForm.owner.trim(),
        people: Number(editForm.people),
        details: editForm.details.trim(),
      })
      .eq("id", selectedReservation.id)
      .select()
      .single();

    if (error) {
      console.error("예약 수정 실패:", error);
      setEditError(
        "예약 수정 중 오류가 발생했습니다. Supabase UPDATE 정책을 확인해주세요."
      );
      return;
    }

    const updatedReservation = {
      id: data.id,
      date: data.date,
      title: data.title,
      purpose: data.purpose || "",
      spaces: data.spaces || [],
      start: data.start_time,
      end: data.end_time,
      owner: data.owner,
      people: data.people || 1,
      details: data.details || "",
      createdBy: data.created_by || selectedReservation.createdBy || null,
    };

    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === updatedReservation.id
          ? updatedReservation
          : reservation
      )
    );

    setSelectedReservation(updatedReservation);
    setEditMode(false);
    setEditError("");
  };

  const cancelReservation = async () => {
    if (!selectedReservation) return;

    if (
      !currentUserId ||
      (!isAdmin && selectedReservation.createdBy !== currentUserId)
    ) {
      setEditError("본인이 등록한 예약만 취소할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(
      `"${selectedReservation.title}" 예약을 취소하시겠습니까?\n취소한 예약은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setEditError("");

    const { error } = await supabase
      .from("beauty_lab_reservations")
      .delete()
      .eq("id", selectedReservation.id);

    if (error) {
      console.error("예약 취소 실패:", error);
      setEditError(
        "예약 취소 중 오류가 발생했습니다. Supabase DELETE 정책을 확인해주세요."
      );
      return;
    }

    setReservations((prev) =>
      prev.filter(
        (reservation) => reservation.id !== selectedReservation.id
      )
    );

    closeReservationDetail();
  };

  const canManageReservation =
    Boolean(selectedReservation) &&
    Boolean(currentUserId) &&
    (isAdmin || selectedReservation.createdBy === currentUserId);

  const canCreateReservation =
    Boolean(currentUserId) && !isAuthLoading;

  const room2Selected =
    reservationForm.spaces.includes(
      "room2"
    );

  const editRoom2Selected =
    editForm.spaces.includes("room2");

  return (
    <div className="beautylab-page">
      <header className="beautylab-header">
        <span className="beautylab-eyebrow">
          BEAUTY VOICE
        </span>

        <h1>BEAUTY LAB</h1>

        <p>
          뷰티랩 공간 예약 및 이용
          현황을 확인해보세요.
        </p>
      </header>

      <section className="beautylab-schedule-card">
        <div className="beautylab-schedule-top">
          <div>
            <span className="beautylab-month-label">
              {selectedDate.getFullYear()}
              년
            </span>

            <strong>
              {selectedDate.getMonth() +
                1}
              월
            </strong>
          </div>

          <button
            type="button"
            className="beautylab-open-calendar"
            onClick={openCalendar}
          >
            <CalendarDays
              size={17}
            />
            전체 달력
          </button>
        </div>

        <div className="beautylab-week-navigation">
          <button
            type="button"
            className="beautylab-week-arrow"
            onClick={() =>
              moveWeek(-1)
            }
            aria-label="이전 주"
          >
            <ChevronLeft
              size={20}
            />
          </button>

          <div className="beautylab-week-grid">
            {weekDays.map(
              (date) => {
                const active =
                  isSameDay(
                    date,
                    selectedDate
                  );

                const isToday =
                  isSameDay(
                    date,
                    today
                  );

                const normalized =
                  normalizeDate(date);

                const bookable =
                  normalized >=
                    today &&
                  normalized <=
                    bookingLimitDate;

                return (
                  <button
                    key={toDateKey(
                      date
                    )}
                    type="button"
                    className={[
                      "beautylab-day-button",
                      active
                        ? "active"
                        : "",
                      isToday
                        ? "today"
                        : "",
                      !bookable
                        ? "outside-range"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setSelectedDate(
                        date
                      )
                    }
                  >
                    <span>
                      {
                        DAY_NAMES[
                          date.getDay()
                        ]
                      }
                    </span>

                    <strong>
                      {date.getDate()}
                    </strong>

                    <small>
                      {isToday
                        ? "오늘"
                        : "\u00A0"}
                    </small>
                  </button>
                );
              }
            )}
          </div>

          <button
            type="button"
            className="beautylab-week-arrow"
            onClick={() =>
              moveWeek(1)
            }
            aria-label="다음 주"
          >
            <ChevronRight
              size={20}
            />
          </button>
        </div>

        <div className="beautylab-booking-range">
          <CalendarDays
            size={15}
          />

          <span>
            예약 가능
            <strong>
              {formatShortDate(
                today
              )}{" "}
              -{" "}
              {formatShortDate(
                bookingLimitDate
              )}
            </strong>
          </span>

          <span className="beautylab-range-description">
            오늘부터 2주 후까지
            예약할 수 있어요.
          </span>
        </div>
      </section>

      <section className="beautylab-status-section">
        <div className="beautylab-status-heading">
          <div>
            <h2>예약 현황</h2>

            <p>
              {formatSelectedDate(
                selectedDate
              )}
            </p>
          </div>

          <span className="beautylab-reservation-count">
            {
              visibleReservations.length
            }
            건
          </span>
        </div>

        <div className="beautylab-space-tabs">
          {SPACES.map(
            (space) => (
              <button
                key={space.id}
                type="button"
                className={[
                  "beautylab-space-tab",
                  selectedSpace ===
                  space.id
                    ? "active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setSelectedSpace(
                    space.id
                  )
                }
              >
                {space.label}
              </button>
            )
          )}
        </div>

        {selectedSpace ===
        "all" ? (
          <div className="beautylab-all-timeline">
            <div className="beautylab-all-header">
              <div className="beautylab-time-header" />

              {REAL_SPACES.map(
                (space) => (
                  <div
                    key={space.id}
                    className="beautylab-space-header"
                  >
                    {space.label}
                  </div>
                )
              )}
            </div>

            <div
              className="beautylab-all-body"
              style={{
                height: `${
                  (END_HOUR -
                    START_HOUR) *
                  HOUR_HEIGHT
                }px`,
              }}
            >
              {timelineHours
                .slice(0, -1)
                .map((hour) => (
                  <div
                    key={hour}
                    className="beautylab-all-hour"
                    style={{
                      top: `${
                        (hour -
                          START_HOUR) *
                        HOUR_HEIGHT
                      }px`,
                    }}
                  >
                    <span>
                      {String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </span>

                    <div />
                  </div>
                ))}

              <div
                className="beautylab-all-hour beautylab-all-final-hour"
                style={{
                  top: `${
                    (END_HOUR -
                      START_HOUR) *
                    HOUR_HEIGHT
                  }px`,
                }}
              >
                <span>
                  {END_HOUR}:00
                </span>
                <div />
              </div>

              <div className="beautylab-all-columns">
                {REAL_SPACES.map(
                  (space) => (
                    <div
                      key={space.id}
                      className="beautylab-space-column"
                    >
                      {reservationsForDate
                        .filter(
                          (
                            reservation
                          ) =>
                            reservation.spaces.includes(
                              space.id
                            )
                        )
                        .map(
                          (
                            reservation
                          ) => (
                            <button
                              type="button"
                              key={`${reservation.id}-${space.id}`}
                              className="beautylab-column-reservation"
                              onClick={() =>
                                openReservationDetail(reservation)
                              }
                              style={{
                                top: `${getTop(
                                  reservation.start
                                )}px`,
                                height: `${getHeight(
                                  reservation.start,
                                  reservation.end
                                )}px`,
                              }}
                            >
                              <strong>
                                {
                                  reservation.title
                                }
                              </strong>

                              <span>
                                {
                                  reservation.start
                                }{" "}
                                -{" "}
                                {
                                  reservation.end
                                }
                              </span>

                              <small>
                                {
                                  reservation.owner
                                }
                              </small>
                            </button>
                          )
                        )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="beautylab-single-timeline">
            <div
              className="beautylab-single-body"
              style={{
                height: `${
                  (END_HOUR -
                    START_HOUR) *
                  HOUR_HEIGHT
                }px`,
              }}
            >
              {timelineHours
                .slice(0, -1)
                .map((hour) => (
                  <div
                    key={hour}
                    className="beautylab-single-hour"
                    style={{
                      top: `${
                        (hour -
                          START_HOUR) *
                        HOUR_HEIGHT
                      }px`,
                    }}
                  >
                    <span>
                      {String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </span>
                    <div />
                  </div>
                ))}

              <div
                className="beautylab-single-hour beautylab-single-final-hour"
                style={{
                  top: `${
                    (END_HOUR -
                      START_HOUR) *
                    HOUR_HEIGHT
                  }px`,
                }}
              >
                <span>
                  {END_HOUR}:00
                </span>
                <div />
              </div>

              <div className="beautylab-single-reservations">
                {visibleReservations.map(
                  (
                    reservation
                  ) => (
                    <button
                      type="button"
                      key={
                        reservation.id
                      }
                      className="beautylab-single-reservation"
                      onClick={() =>
                        openReservationDetail(reservation)
                      }
                      style={{
                        top: `${getTop(
                          reservation.start
                        )}px`,
                        height: `${getHeight(
                          reservation.start,
                          reservation.end
                        )}px`,
                      }}
                    >
                      <div className="beautylab-single-reservation-title">
                        <div>
                          <strong>
                            {
                              reservation.title
                            }
                          </strong>

                          <span>
                            {reservation.spaces
                              .map(
                                getSpaceLabel
                              )
                              .join(
                                " · "
                              )}
                          </span>
                        </div>

                        <div className="beautylab-reservation-time">
                          <Clock3
                            size={
                              14
                            }
                          />
                          {
                            reservation.start
                          }{" "}
                          -{" "}
                          {
                            reservation.end
                          }
                        </div>
                      </div>

                      <div className="beautylab-reservation-meta">
                        <span>
                          <MapPin
                            size={
                              14
                            }
                          />
                          {
                            reservation.owner
                          }
                        </span>

                        <span>
                          <Users
                            size={
                              14
                            }
                          />
                          {
                            reservation.people
                          }
                          명
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="beautylab-reserve-bar">
        <div>
          <span>
            {formatSelectedDate(
              selectedDate
            )}
          </span>

          <strong>
            {!user
              ? "로그인 후 예약할 수 있습니다."
              : isBookableDate
              ? "예약 가능한 날짜입니다."
              : "예약 현황만 확인할 수 있습니다."}
          </strong>
        </div>

        <button
          type="button"
          disabled={
            !isBookableDate || !canCreateReservation
          }
          onClick={
            openReservation
          }
        >
          <Plus size={19} />

          {!user
            ? "로그인 필요"
            : isPastDate
            ? "지난 날짜"
            : isBeyondBookingLimit
            ? "예약 기간 외"
            : "예약하기"}
        </button>
      </div>

      {calendarOpen && (
        <div
          className="beautylab-calendar-overlay"
          onClick={() =>
            setCalendarOpen(
              false
            )
          }
        >
          <div
            className="beautylab-calendar-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="beautylab-calendar-modal-top">
              <div>
                <span>
                  날짜 선택
                </span>

                <strong>
                  {calendarMonth.getFullYear()}
                  년{" "}
                  {calendarMonth.getMonth() +
                    1}
                  월
                </strong>
              </div>

              <button
                type="button"
                className="beautylab-calendar-close"
                onClick={() =>
                  setCalendarOpen(
                    false
                  )
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="beautylab-calendar-month-nav">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() -
                        1,
                      1
                    )
                  )
                }
              >
                <ChevronLeft
                  size={19}
                />
              </button>

              <span>
                {calendarMonth.getFullYear()}
                .{" "}
                {String(
                  calendarMonth.getMonth() +
                    1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() +
                        1,
                      1
                    )
                  )
                }
              >
                <ChevronRight
                  size={19}
                />
              </button>
            </div>

            <div className="beautylab-calendar-week-labels">
              {DAY_NAMES.map(
                (day) => (
                  <span key={day}>
                    {day}
                  </span>
                )
              )}
            </div>

            <div className="beautylab-calendar-days">
              {calendarDays.map(
                (
                  date,
                  index
                ) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="beautylab-calendar-empty"
                      />
                    );
                  }

                  const active =
                    isSameDay(
                      date,
                      selectedDate
                    );

                  const isToday =
                    isSameDay(
                      date,
                      today
                    );

                  const normalized =
                    normalizeDate(
                      date
                    );

                  const bookable =
                    normalized >=
                      today &&
                    normalized <=
                      bookingLimitDate;

                  return (
                    <button
                      key={toDateKey(
                        date
                      )}
                      type="button"
                      className={[
                        "beautylab-calendar-day",
                        active
                          ? "active"
                          : "",
                        isToday
                          ? "today"
                          : "",
                        !bookable
                          ? "outside-range"
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                      onClick={() =>
                        selectCalendarDate(
                          date
                        )
                      }
                    >
                      {date.getDate()}

                      {isToday && (
                        <small>
                          오늘
                        </small>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            <div className="beautylab-calendar-footer">
              <div>
                <span className="beautylab-calendar-legend-dot" />

                예약 가능

                <strong>
                  {formatShortDate(
                    today
                  )}{" "}
                  -{" "}
                  {formatShortDate(
                    bookingLimitDate
                  )}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(
                    new Date()
                  );

                  setCalendarOpen(
                    false
                  );
                }}
              >
                오늘
              </button>
            </div>
          </div>
        </div>
      )}

      {reservationOpen && (
        <div
          className="beautylab-booking-overlay"
          onClick={() =>
            setReservationOpen(
              false
            )
          }
        >
          <form
            className="beautylab-booking-modal"
            onSubmit={
              submitReservation
            }
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="beautylab-booking-modal-header">
              <div>
                <span>
                  BEAUTY LAB
                </span>

                <h2>
                  공간 예약하기
                </h2>

                <p>
                  {formatSelectedDate(
                    selectedDate
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReservationOpen(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="beautylab-booking-field">
              <label>
                공간
                <strong>
                  *
                </strong>
              </label>

              <div className="beautylab-booking-space-grid">
                {REAL_SPACES.map(
                  (space) => {
                    const selected =
                      reservationForm.spaces.includes(
                        space.id
                      );

                    return (
                      <button
                        key={
                          space.id
                        }
                        type="button"
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleReservationSpace(
                            space.id
                          )
                        }
                      >
                        <span>
                          {selected && (
                            <Check
                              size={
                                14
                              }
                            />
                          )}
                        </span>

                        {
                          space.label
                        }
                      </button>
                    );
                  }
                )}
              </div>

              {room2Selected && (
                <div className="beautylab-room2-guide">
                  <AlertTriangle
                    size={16}
                  />

                  <span>
                    ROOM 2는
                    메이크업실을
                    통해 출입하는
                    공간입니다.
                    동시간대
                    메이크업실
                    예약 현황을
                    확인해주세요.
                  </span>
                </div>
              )}
            </div>

            <div className="beautylab-booking-field">
              <label>
                예약명
                <strong>
                  *
                </strong>
              </label>

              <input
                type="text"
                placeholder="예: 메이크업 신규교육"
                value={
                  reservationForm.title
                }
                onChange={(
                  event
                ) =>
                  setReservationForm(
                    (prev) => ({
                      ...prev,
                      title:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div className="beautylab-booking-field">
              <label>
                사용 목적
              </label>

              <select
                value={
                  reservationForm.purpose
                }
                onChange={(
                  event
                ) =>
                  setReservationForm(
                    (prev) => ({
                      ...prev,
                      purpose:
                        event
                          .target
                          .value,
                    })
                  )
                }
              >
                <option>
                  신규교육
                </option>

                <option>
                  내부교육
                </option>

                <option>
                  회의
                </option>

                <option>
                  촬영
                </option>

                <option>
                  실습
                </option>

                <option>
                  기타
                </option>
              </select>
            </div>

            <div className="beautylab-booking-time-row">
              <div className="beautylab-booking-field">
                <label>
                  시작 시간
                  <strong>
                    *
                  </strong>
                </label>

                <TimeDropdown
                  value={reservationForm.start}
                  onChange={(time) =>
                    setReservationForm((prev) => ({
                      ...prev,
                      start: time,
                    }))
                  }
                  getUnavailable={(time) =>
                    reservationForm.spaces.length > 0 &&
                    isTimeOccupiedForSpaces(
                      time,
                      reservationForm.spaces
                    )
                  }
                  unavailableLabel="예약됨"
                />
              </div>

              <div className="beautylab-booking-time-divider">
                ~
              </div>

              <div className="beautylab-booking-field">
                <label>
                  종료 시간
                  <strong>
                    *
                  </strong>
                </label>

                <TimeDropdown
                  value={reservationForm.end}
                  onChange={(time) =>
                    setReservationForm((prev) => ({
                      ...prev,
                      end: time,
                    }))
                  }
                  getUnavailable={(time) =>
                    isEndTimeUnavailable(
                      time,
                      reservationForm.start,
                      reservationForm.spaces
                    )
                  }
                  unavailableLabel="선택 불가"
                />
              </div>
            </div>

            <div className="beautylab-booking-two-column">
              <div className="beautylab-booking-field">
                <label>
                  예약자
                  <strong>
                    *
                  </strong>
                </label>

                <input
                  type="text"
                  value={currentUserName}
                  readOnly
                  className="beautylab-readonly-input"
                  title="현재 로그인 계정의 이름이 자동으로 입력됩니다."
                />
              </div>

              <div className="beautylab-booking-field">
                <label>
                  사용 인원
                </label>

                <div className="beautylab-people-input">
                  <input
                    type="number"
                    min="1"
                    value={
                      reservationForm.people
                    }
                    onChange={(
                      event
                    ) =>
                      setReservationForm(
                        (
                          prev
                        ) => ({
                          ...prev,
                          people:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                  <span>
                    명
                  </span>
                </div>
              </div>
            </div>

            <div className="beautylab-booking-field">
              <label>
                상세 내용
              </label>

              <textarea
                rows="3"
                maxLength="500"
                placeholder="필요한 준비사항이나 상세 내용을 입력해주세요."
                value={
                  reservationForm.details
                }
                onChange={(
                  event
                ) =>
                  setReservationForm(
                    (prev) => ({
                      ...prev,
                      details:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />

              <span className="beautylab-booking-character-count">
                {
                  reservationForm
                    .details
                    .length
                }{" "}
                / 500
              </span>
            </div>

            {reservationError && (
              <div className="beautylab-booking-error">
                <AlertTriangle
                  size={16}
                />
                {
                  reservationError
                }
              </div>
            )}

            <div className="beautylab-booking-actions">
              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setReservationOpen(
                    false
                  )
                }
              >
                닫기
              </button>

              <button
                type="submit"
                className="submit"
              >
                예약하기
              </button>
            </div>
          </form>
        </div>
      )}

      {detailOpen && selectedReservation && (
        <div
          className="beautylab-booking-overlay"
          onClick={closeReservationDetail}
        >
          <form
            className="beautylab-booking-modal"
            onSubmit={saveReservationEdit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="beautylab-booking-modal-header">
              <div>
                <span>BEAUTY LAB</span>

                <h2>
                  {editMode ? "예약 수정" : "예약 상세"}
                </h2>

                <p>
                  {selectedReservation.date} ·{" "}
                  {selectedReservation.start} - {selectedReservation.end}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReservationDetail}
              >
                <X size={20} />
              </button>
            </div>

            <div className="beautylab-booking-field">
              <label>공간</label>

              <div className="beautylab-booking-space-grid">
                {REAL_SPACES.map((space) => {
                  const selected = editForm.spaces.includes(space.id);

                  return (
                    <button
                      key={space.id}
                      type="button"
                      className={selected ? "selected" : ""}
                      disabled={!editMode}
                      onClick={() => {
                        if (editMode) {
                          toggleEditSpace(space.id);
                        }
                      }}
                    >
                      <span>
                        {selected && <Check size={14} />}
                      </span>

                      {space.label}
                    </button>
                  );
                })}
              </div>

              {editRoom2Selected && (
                <div className="beautylab-room2-guide">
                  <AlertTriangle size={16} />

                  <span>
                    ROOM 2는 메이크업실을 통해 출입하는 공간입니다.
                    동시간대 메이크업실 예약 현황을 확인해주세요.
                  </span>
                </div>
              )}
            </div>

            <div className="beautylab-booking-field">
              <label>
                예약명
                {editMode && <strong>*</strong>}
              </label>

              <input
                type="text"
                value={editForm.title}
                readOnly={!editMode}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div className="beautylab-booking-field">
              <label>사용 목적</label>

              <select
                value={editForm.purpose}
                disabled={!editMode}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    purpose: event.target.value,
                  }))
                }
              >
                <option>신규교육</option>
                <option>내부교육</option>
                <option>회의</option>
                <option>촬영</option>
                <option>실습</option>
                <option>기타</option>
              </select>
            </div>

            <div className="beautylab-booking-time-row">
              <div className="beautylab-booking-field">
                <label>시작 시간</label>

                <TimeDropdown
                  value={editForm.start}
                  disabled={!editMode}
                  onChange={(time) =>
                    setEditForm((prev) => ({
                      ...prev,
                      start: time,
                    }))
                  }
                  getUnavailable={(time) =>
                    editForm.spaces.length > 0 &&
                    isTimeOccupiedForSpaces(
                      time,
                      editForm.spaces,
                      selectedReservation.id,
                      selectedReservation.date
                    )
                  }
                  unavailableLabel="예약됨"
                />
              </div>

              <div className="beautylab-booking-time-divider">
                ~
              </div>

              <div className="beautylab-booking-field">
                <label>종료 시간</label>

                <TimeDropdown
                  value={editForm.end}
                  disabled={!editMode}
                  onChange={(time) =>
                    setEditForm((prev) => ({
                      ...prev,
                      end: time,
                    }))
                  }
                  getUnavailable={(time) =>
                    isEndTimeUnavailable(
                      time,
                      editForm.start,
                      editForm.spaces,
                      selectedReservation.id,
                      selectedReservation.date
                    )
                  }
                  unavailableLabel="선택 불가"
                />
              </div>
            </div>

            <div className="beautylab-booking-two-column">
              <div className="beautylab-booking-field">
                <label>예약자</label>

                <input
                  type="text"
                  value={editForm.owner}
                  readOnly={!editMode}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      owner: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="beautylab-booking-field">
                <label>사용 인원</label>

                <div className="beautylab-people-input">
                  <input
                    type="number"
                    min="1"
                    value={editForm.people}
                    readOnly={!editMode}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        people: event.target.value,
                      }))
                    }
                  />

                  <span>명</span>
                </div>
              </div>
            </div>

            <div className="beautylab-booking-field">
              <label>상세 내용</label>

              <textarea
                rows="3"
                maxLength="500"
                value={editForm.details}
                readOnly={!editMode}
                placeholder="등록된 상세 내용이 없습니다."
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    details: event.target.value,
                  }))
                }
              />

              {editMode && (
                <span className="beautylab-booking-character-count">
                  {editForm.details.length} / 500
                </span>
              )}
            </div>

            {editError && (
              <div className="beautylab-booking-error">
                <AlertTriangle size={16} />
                {editError}
              </div>
            )}

            <div className="beautylab-booking-actions">
              {editMode ? (
                <>
                  <button
                    type="button"
                    className="cancel"
                    onClick={() => {
                      setEditMode(false);
                      setEditError("");
                      setEditForm({
                        spaces: [...selectedReservation.spaces],
                        title: selectedReservation.title || "",
                        purpose:
                          selectedReservation.purpose || "내부교육",
                        start: selectedReservation.start,
                        end: selectedReservation.end,
                        owner: selectedReservation.owner || "",
                        people: selectedReservation.people || 1,
                        details: selectedReservation.details || "",
                      });
                    }}
                  >
                    수정 취소
                  </button>

                  <button
                    type="submit"
                    className="submit"
                  >
                    수정 완료
                  </button>
                </>
              ) : canManageReservation ? (
                <>
                  <button
                    type="button"
                    className="cancel"
                    onClick={cancelReservation}
                  >
                    예약 취소
                  </button>

                  <button
                    type="button"
                    className="submit"
                    onClick={() => {
                      setEditMode(true);
                      setEditError("");
                    }}
                  >
                    예약 수정
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="submit"
                  onClick={closeReservationDetail}
                >
                  확인
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}