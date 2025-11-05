import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { clearNotification } from '../Store/slices/notificationSlice';

export default function Notification() {
  const notification = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);
  const [localNotification, setLocalNotification] = useState(null);

  useEffect(() => {
    if (notification.show) {
      if (visible) {
        // If a notification is already visible, hide it first
        setVisible(false);

        // Wait for exit animation, then show the new notification
        const transitionTimeout = setTimeout(() => {
          setLocalNotification(notification);
          setVisible(true);
        }, 500); // must match transition duration

        return () => clearTimeout(transitionTimeout);
      } else {
        // No active notification, show directly
        setLocalNotification(notification);
        setVisible(true);
      }

      // Auto-dismiss after 4s
      const autoHide = setTimeout(() => {
        setVisible(false);
        setTimeout(() => dispatch(clearNotification()), 500);
      }, 3000);

      return () => clearTimeout(autoHide);
    }
  }, [notification, dispatch]);

  if (!localNotification) return null;

  const { message, type, timestamp } = localNotification;

  return (
    <div
  className={`
    fixed top-20 sm:right-6 right-2 z-50 
    w-[90vw] sm:w-80 max-w-sm 
    p-3 sm:p-4 rounded-lg shadow-lg text-white 
    transform transition-all duration-500 ease-in-out
    ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    ${
      type === 'success'
        ? 'bg-green-600'
        : type === 'error'
        ? 'bg-red-600'
        : type === 'warning'
        ? 'bg-yellow-500 text-black'
        : 'bg-blue-600'
    }
  `}
>
  <div className="flex justify-between items-start">
    <div className="pr-2">
      <p className="font-semibold text-sm sm:text-base">{message}</p>
      {timestamp && (
        <p className="text-xs opacity-80 mt-1">
          🕒 {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
    <button
      onClick={() => {
        setVisible(false);
        setTimeout(() => dispatch(clearNotification()), 500);
      }}
      className="ml-4 text-lg font-bold hover:opacity-80"
    >
      &times;
    </button>
  </div>
</div>

  );
}
