import { useState } from "react";

const usePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setPasswordsMatch(event.target.value === confirmPassword);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
    setPasswordsMatch(event.target.value === password);
  };

  const handleResetPassword = () => {
    setPassword("");
    setConfirmPassword("");
    setPasswordsMatch(true);
  };

  return {
    password,
    confirmPassword,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleResetPassword,
    passwordsMatch,
  };
};

export default usePassword;
