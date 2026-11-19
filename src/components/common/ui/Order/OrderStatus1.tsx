/* eslint-disable react-refresh/only-export-components */
import {
  CheckCircle,
  FactoryIcon,
  MinusCircle,
  SquareGanttChart,
  StickyNote,
  Truck,
  UserCheck2,
  UserX2,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
interface Props {
  status: string;
}
const OrderStatus1 = (props: Props) => {
  const { status } = props;
  const { t } = useTranslation();
  const indexOfStatus = Object.values(OrderStatus_labels).findIndex(
    (item) => item === status
  );
  return (
    <div className=" flex flex-col min-w-[30rem] overflow-hidden  p-8 bg-gray-50 shadow-md dark:bg-card rounded-lg relative">
      <span className=" font-semibold text-2xl mb-4 dark:text-white">
        {" "}
        {t("order_status")}
      </span>
      <SquareGanttChart
        width={300}
        height={300}
        className=" rotate-45 absolute opacity-5 w-40 bottom-[-6rem] left-[-3rem] object-cover z-1 dark:text-white"
      />
      <div className="flex flex-col gap-2">
        {Object.values(OrderStatus_labels).map((item, index) => {
          const classNameIcon = `${status === item ? "text-yellow-500 font-bold" : "text-gray-300"}`;
          const classNameSuccess = `text-green-500 `;
          const classNameSelected =
            indexOfStatus > index ? classNameSuccess : classNameIcon;
          const iconProps = { className: classNameSelected, width: 30 };
          const show =
            status !== "canceled" &&
            item !== "canceled" &&
            status !== "user_rejected" &&
            item !== "user_rejected" &&
            status !== "factory_rejected" &&
            item !== "factory_rejected";
          return (
            show && (
              <div
                key={index}
                className={`flex items-center gap-2 ${status === item && " bg-yellow-50 dark:bg-gray-800"}`}
              >
                {/** check or minus */}
                <div className="flex flex-col items-center relative">
                  {indexOfStatus > index ? (
                    <CheckCircle className={classNameSelected} width={15} />
                  ) : (
                    <MinusCircle className={classNameSelected} width={15} />
                  )}
                  {index + 1 < Object.values(OrderStatus_labels).length && (
                    <span className={classNameSelected + " absolute top-4 "}>
                      |
                    </span>
                  )}
                </div>
                {/** icon */}
                {index === 0 ? (
                  <StickyNote {...iconProps} />
                ) : index === 1 ? (
                  <UserX2 {...iconProps} />
                ) : index === 2 ? (
                  <FactoryIcon {...iconProps} />
                ) : index === 3 ? (
                  <UserCheck2 {...iconProps} />
                ) : index === 4 ? (
                  <FactoryIcon {...iconProps} />
                ) : index === 5 ? (
                  <UserX2 {...iconProps} />
                ) : index === 6 ? (
                  <FactoryIcon {...iconProps} />
                ) : index === 7 ? (
                  <Truck {...iconProps} />
                ) : (
                  <CheckCircle {...iconProps} />
                )}
                <span className={classNameSelected}>{t(item)}</span>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatus1;
// export enum OrderStatus_values {
//   USER_REQUEST = 1,
//   // order canceled by customer
//   CANCELED = 2,
//   // pending when factory update order waiting to accept by user
//   FACTORY_REQUEST = 3,
//   // when customer accept factory update
//   USER_ACCEPTED = 4,
//   // factory accept order
//   FACTORY_ACCEPTED = 5,
//   // customer reject factory update
//   USER_REJECTED = 6,
//   // factory reject order
//   FACTORY_REJECTED = 7,
//   // when driver ready to ship the order
//   ON_DELIVERY = 8,
//   // when order shipped to customer
//   COMPLETED = 9,
// }
export enum OrderStatus_labels {
  USER_REQUEST = "user_request",
  // order canceled by customer
  CANCELED = "canceled",
  // pending when factory update order waiting to accept by user
  FACTORY_REQUEST = "factory_request",
  // when customer accept factory update
  USER_ACCEPTED = "user_accepted",
  // factory accept order
  FACTORY_ACCEPTED = "factory_accepted",
  // customer reject factory update
  USER_REJECTED = "user_rejected",
  // factory reject order
  FACTORY_REJECTED = "factory_rejected",
  // when driver ready to ship the order
  ON_DELIVERY = "on_delivery",
  // when order shipped to customer
  COMPLETED = "completed",
}
