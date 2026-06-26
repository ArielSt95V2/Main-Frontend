import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/redux/features/authApiSlice";
import { toast } from "react-toastify";

import { mintTraceId } from "@/lib/traceId";
import { createLogger } from "@/lib/logger";

export default function useRegister() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    re_password: "",
  });

  const { first_name, last_name, email, password, re_password } = formData;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData({ ...formData, [name]: value });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Log the form submission
    const traceId = mintTraceId();
    const log = createLogger("auth.register", traceId);
    log.info("click.register", "Register form submitted");

    register({ first_name, last_name, email, password, re_password, traceId })
      .unwrap()
      .then(() => {
        // Log the success
        log.info(
          "register.ui.success",
          "Registration succeeded; redirecting to login",
        );
        toast.success("Please check email to verify account");
        router.push("/auth/login");
      })
      .catch(() => {
        // Log the failure
        log.error("register.ui.failed", "Registration failed", {
          userMessage: "Failed to register account",
        });
        toast.error("Failed to register account");
      });
  };

  return {
    first_name,
    last_name,
    email,
    password,
    re_password,
    isLoading,
    onChange,
    onSubmit,
  };
}
