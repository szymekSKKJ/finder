import { Dispatch, MutableRefObject, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import "./DateOfBirthdayForm.scss";
import Button from "../../../../Global/Button/Button";
import { CurrentUserStateContext } from "../../../App";

const getCalendarData = () => {
  const days = [];
  const months = [];
  const years = [];

  const minimumYearsAdult = new Date().getFullYear() - 16;
  const maximumYearsAdult = minimumYearsAdult - 84; // Means 100 years old

  for (let i = 1; i <= 31; i++) {
    i <= 9 ? days.push(`0${i}`) : days.push(`${i}`);
  }

  for (let i = 1; i <= 12; i++) {
    i <= 9 ? months.push(`0${i}`) : months.push(`${i}`);
  }

  for (let i = maximumYearsAdult; i <= minimumYearsAdult; i++) {
    years.push(i);
  }

  return { days: days, months: months, years: years };
};

const setScrollingState = (setIsScrolling: Dispatch<SetStateAction<boolean>>, timeoutRef: MutableRefObject<any>) => {
  setIsScrolling(true);
  clearTimeout(timeoutRef.current);

  timeoutRef.current = setTimeout(() => {
    setIsScrolling(false);
  }, 500);
};

const DateOfBirthdayForm = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const calendarData = getCalendarData();
  const [pickedDate, setPickedDate] = useState<{ day: number; month: number; year: number }>({
    day: 23,
    month: 10,
    year: 1984,
  });
  const [isScrolling, setIsScrolling] = useState(true);
  const timeoutRef = useRef();
  const datePickerElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (datePickerElementRef.current) {
      [...datePickerElementRef.current.children].forEach((childElement) => {
        childElement.scrollTop = childElement.scrollHeight * 0.7; // If changed remember to update 'pickedDate'
      });
    }
  }, []);

  useEffect(() => {
    if (isScrolling === false && datePickerElementRef.current) {
      const date: { day: number; month: number; year: number } = { day: 0, month: 0, year: 0 };

      [...datePickerElementRef.current.children].forEach((childElement, index) => {
        const childHeight = 55;
        const elementCount = parseInt((Math.ceil(childElement.scrollTop / childHeight) + 1).toString());

        if (index === 0) {
          date.day = elementCount;
        } else if (index === 1) {
          date.month = elementCount;
        } else if (index === 2) {
          date.year = new Date().getFullYear() - 101 + elementCount; // Minus 101 because user must be atleast 16 years old and not older then 100 years old (look getCalendarData func)
        }
      });

      setPickedDate(date);
    }
  }, [isScrolling]);

  return (
    <div className="date-of-birthday-form-wrapper">
      <h1>Data urodzenia</h1>
      <p>Podanie prawdziej daty urodzenia zapewnia, zwiększy Twoją wiarygodność</p>
      <div className="content-wrapper">
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="date-picker" ref={datePickerElementRef}>
            <div className="days" onScroll={() => setScrollingState(setIsScrolling, timeoutRef)}>
              {calendarData.days.map((day, index) => {
                const { month, year } = pickedDate;
                const monthsWith31Days = [1, 3, 5, 7, 8, 10, 12];

                const pickedMonthIncludesInMonthsWith31Days = monthsWith31Days.some((monthWith31Days) => month === monthWith31Days);

                if (pickedMonthIncludesInMonthsWith31Days) {
                  return <p key={day}>{day}</p>;
                } else if (month === 2 && year) {
                  if (year % 4 === 0 && index < 29) {
                    return <p key={day}>{day}</p>;
                  } else if (index < 28) {
                    return <p key={day}>{day}</p>;
                  }
                } else if (index < 30) {
                  return <p key={day}>{day}</p>;
                }
              })}
            </div>
            <div className="months" onScroll={() => setScrollingState(setIsScrolling, timeoutRef)}>
              {calendarData.months.map((month) => {
                return <p key={month}>{month}</p>;
              })}
            </div>
            <div className="years" onScroll={() => setScrollingState(setIsScrolling, timeoutRef)}>
              {calendarData.years.map((year) => {
                return <p key={year}>{year}</p>;
              })}
            </div>
          </div>
          <Button
            isValid={isScrolling === false}
            show={isScrolling === false ? "ImageEditorForm" : "DateOfBirthdayForm"}
            animationIn={{ className: "animationIn", duration: 500 }}
            animationOut={{ className: "animationOut", duration: 500 }}
            onClick={() => {
              if (isScrolling === false) {
                setStatusStage((currentValue) => (currentValue === 3 ? currentValue + 1 : currentValue));

                setCurrentUserData((currentValue) => {
                  const coppiedCurrentValue = { ...currentValue };

                  const dateObject = new Date(pickedDate.year, pickedDate.month, pickedDate.day);

                  coppiedCurrentValue.dateOfBirthday = dateObject;

                  return coppiedCurrentValue;
                });
              }
            }}>
            Dalej
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DateOfBirthdayForm;
