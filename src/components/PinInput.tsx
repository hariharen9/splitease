
import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  onComplete?: (pin: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

const PinInput = ({
  length = 6,
  onComplete,
  className,
  inputClassName,
  disabled = false
}: PinInputProps) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  useEffect(() => {
    if (pin.every(digit => digit !== "") && onComplete) {
      onComplete(pin.join(""));
    }
  }, [pin, onComplete]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    
    // Handle pasting of multiple digits
    if (value.length > 1) {
      const digits = value.split("").slice(0, length);
      const newPin = [...pin];
      
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newPin[index + i] = digit;
        }
      });
      
      setPin(newPin);
      
      // Focus on the next empty input or the last one
      const nextEmptyIndex = newPin.findIndex(digit => digit === "");
      if (nextEmptyIndex !== -1 && nextEmptyIndex < length) {
        inputRefs.current[nextEmptyIndex].focus();
      } else if (inputRefs.current[length - 1]) {
        inputRefs.current[length - 1].focus();
      }
      
      return;
    }
    
    // Handle single digit
    if (/^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value.slice(-1);
      setPin(newPin);
      
      // Automatically focus next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      // Move focus to previous input when backspace is pressed on an empty input
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  return (
    <div 
      className={cn(
        "flex justify-center items-center gap-2 sm:gap-4",
        className
      )}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={pin[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          className={cn(
            "pin-input w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl border-2 rounded-md bg-white/[0.03] border-white/10 focus:border-primary/60 transition-all duration-200 glass-input",
            inputClassName
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default PinInput;
