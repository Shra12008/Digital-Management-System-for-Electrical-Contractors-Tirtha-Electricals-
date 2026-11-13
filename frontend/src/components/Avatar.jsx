import React from "react";

export const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

/** Round profile picture: the uploaded photo, or initials when there is none. */
export default function Avatar({ name, src, size = 40, className = "" }) {
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.36)) };
  return (
    <span className={`user-avatar ${className}`} style={style} title={name}>
      {src ? <img src={src} alt={name || "Profile"} /> : initialsOf(name)}
    </span>
  );
}
