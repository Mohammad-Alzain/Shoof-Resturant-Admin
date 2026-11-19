import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
function OtpInput(props: FieldPropsInterface) {
  return (
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <div>
        <InputOTP
          disabled={props?.disabled}
          dir="ltr"
          name={props?.name}
          onChange={props?.onChange}
          value={props.value}
          maxLength={6}
          placeholder={props?.placeholder}
        >
          <InputOTPGroup dir="ltr" className="gap-4 text-[20px]">
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={0} />
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={1} />
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={2} />
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={3} />
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={4} />
            <InputOTPSlot className="w-14 h-14 border-2 rounded-md" index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </InputContainer>
  );
}

export default OtpInput;
