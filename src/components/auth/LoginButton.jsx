import React, { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  signInWithGoogle,
  signOut,
} from "../../services/authService";

export default function LoginButton() {
  const {
    user,
    isLoggedIn,
    isAuthLoading,
  } = useAuth();

  const [isLoading, setIsLoading] =
    useState(false);

  const handleLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert("로그인에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error(error);
      alert("로그아웃에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="authCard">
        <span className="authLoading">
          로그인 확인 중...
        </span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className="authLoginButton"
        onClick={handleLogin}
        disabled={isLoading}
      >
        <LogIn size={17} />
        {isLoading
          ? "로그인 중..."
          : "Google로 로그인"}
      </button>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "사용자";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "";

  return (
  <div className="authCard">
    <div className="authProfile">
      {avatarUrl ? (
        <img
          className="authAvatar"
          src={avatarUrl}
          alt={`${displayName} 프로필`}
        />
      ) : (
        <div className="authAvatarFallback">
          {displayName.slice(0, 1)}
        </div>
      )}

      <div className="authInfo">
        <strong>{displayName}</strong>
        <span>로그인 중</span>
      </div>
    </div>

    <button
      type="button"
      className="authLogoutButton"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut size={16} />
      <span>로그아웃</span>
    </button>
  </div>
);
}