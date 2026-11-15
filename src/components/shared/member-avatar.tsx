import type { Member } from "@/features/family/types";
export function MemberAvatar({
  member,
  small = false,
}: {
  member: Member;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${member.color} ${small ? "avatar-small" : ""}`}
      title={member.name}
      aria-label={member.name}
    >
      {member.initials}
    </span>
  );
}
