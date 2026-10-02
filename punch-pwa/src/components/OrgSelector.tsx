"use client";

export type OrgSlug = "campus" | "cultfit" | "enterprise" | "web3";

export interface OrgInfo {
  slug: OrgSlug;
  name: string;
  badge: string;
  icon: string;
}

export const ORG_LIST: OrgInfo[] = [
  { slug: "campus", name: "University Campus", badge: "Campus OS", icon: "🎓" },
  { slug: "cultfit", name: "Cult.fit Fitness Center", badge: "Cult Pro", icon: "🏋️" },
  { slug: "enterprise", name: "Tech Enterprise", badge: "Workplace ID", icon: "🏢" },
  { slug: "web3", name: "Web3 DAO Hackathon", badge: "POAP Protocol", icon: "🎟️" },
];

interface OrgSelectorProps {
  value: OrgSlug;
  onChange: (slug: OrgSlug) => void;
}

export default function OrgSelector({ value, onChange }: OrgSelectorProps) {
  return (
    <div className="field">
      <span>Organization Context</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrgSlug)}
        className="org-select-dropdown"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#18181b",
          color: "#f4f4f5",
          border: "1px solid #27272a",
          fontSize: "14px",
          fontWeight: 500,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {ORG_LIST.map((org) => (
          <option key={org.slug} value={org.slug}>
            {org.icon} {org.name} ({org.badge})
          </option>
        ))}
      </select>
    </div>
  );
}
