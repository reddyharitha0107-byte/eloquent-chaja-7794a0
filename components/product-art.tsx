import type { ProductKind } from "@/lib/types";

export default function ProductArt({ kind, small = false }: { kind: ProductKind; small?: boolean }) {
  return <div className={`product-art art-${kind} ${small ? "art-small" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 220 150" fill="none">
      <ellipse cx="110" cy="126" rx="58" ry="9" fill="currentColor" opacity=".08" />
      {kind === "butter" && <>
        <path d="m49 64 105-17 25 20-104 19Z" fill="#ffe995" /><path d="m49 64 26 22v38L49 102Z" fill="#e8b53f" /><path d="m75 86 104-19v38l-104 19Z" fill="#ffdf66" />
        <path d="m76 91 99-18v27l-99 18Z" fill="#fff8d9" /><text x="94" y="94" fill="#d63a31" fontSize="20" fontWeight="800" transform="rotate(-10 94 94)">Amul</text><text x="96" y="109" fill="#596447" fontSize="10" fontWeight="700" transform="rotate(-10 96 109)">BUTTER</text>
        <path d="m64 59 49-8 11 8-49 8Z" fill="#fff4c6" /><path d="m151 78 13-2v20l-13 2Z" fill="#f0be50" />
      </>}
      {kind === "bread" && <>
        <path d="M62 55c0-20 24-34 48-34s48 14 48 34l-6 66H68Z" fill="#e0ba83" /><path d="M62 55c0-20 24-34 48-34s48 14 48 34" stroke="#ae7848" strokeWidth="7" />
        <path d="m74 30 12 18m16-25 5 24m18-22-4 23m19-15-8 17" stroke="#f5ddb4" strokeWidth="5" strokeLinecap="round" />
        <path d="M65 67h90l-3 45H68Z" fill="#486948" /><path d="M82 78h56v23H82Z" fill="#f5ebcd" /><text x="110" y="87" textAnchor="middle" fill="#486948" fontSize="8" fontWeight="800">HARVEST</text><text x="110" y="96" textAnchor="middle" fill="#486948" fontSize="6">WHOLE WHEAT</text>
        <path d="M70 57h79" stroke="#f5deb9" strokeWidth="3" />
      </>}
      {kind === "milk" && <>
        <path d="m86 23 43 1 16 22v76H76V46Z" fill="#fcfcf5" /><path d="m129 24 16 22v76h-17V46Z" fill="#e0e8ed" /><path d="M86 23v20H76m10-20 42 1v22" stroke="#becfd9" strokeWidth="2" />
        <path d="M76 55h52v50H76Z" fill="#468bc0" /><path d="M76 95c17-14 30 6 52-7v17H76Z" fill="#76b7d4" /><text x="102" y="73" textAnchor="middle" fill="white" fontSize="10" fontWeight="800">Nandini</text><text x="102" y="85" textAnchor="middle" fill="white" fontSize="7">TONED MILK</text><text x="102" y="116" textAnchor="middle" fill="#5382a2" fontSize="7">1 LITRE</text>
      </>}
      {kind === "tomatoes" && <>
        <circle cx="84" cy="93" r="31" fill="#df5541" /><circle cx="137" cy="92" r="29" fill="#ed6551" /><circle cx="111" cy="66" r="29" fill="#e24b37" />
        <path d="m111 34 5 18 14-7-8 14 10 7-18-2-7 12-1-16-15-7 16-1Z" fill="#558458" /><path d="m85 63 4 12 12-4-7 10 8 6-13-1-7 8 1-13-9-6 10 1Z" fill="#467c4c" /><path d="m138 62 3 12 13-2-9 9 7 7-13-4-7 9 2-13-12-5 12 1Z" fill="#467c4c" />
        <path d="M95 58a18 18 0 0 0-4 8m-22 21a19 19 0 0 0-3 9m61-12a16 16 0 0 0-4 6" stroke="#ffb3a0" strokeWidth="4" strokeLinecap="round" />
      </>}
      {kind === "honey" && <>
        <rect x="80" y="38" width="61" height="85" rx="15" fill="#d9a63e" /><path d="M84 55h53v55H84Z" fill="#e9b750" /><rect x="84" y="26" width="53" height="17" rx="4" fill="#687447" /><path d="M88 31h45m-45 5h45" stroke="#899166" strokeWidth="2" />
        <rect x="85" y="66" width="51" height="40" rx="2" fill="#faf3db" /><path d="m111 72 5 4v6l-5 4-5-4v-6Z" stroke="#bd9341" /><text x="111" y="94" textAnchor="middle" fill="#77633c" fontSize="9" fontWeight="700">COORG</text><text x="111" y="101" textAnchor="middle" fill="#77633c" fontSize="5">WILDFLOWER HONEY</text><path d="M89 49v11" stroke="#f7d67e" strokeWidth="4" strokeLinecap="round" />
      </>}
      {kind === "coffee" && <>
        <path d="M82 23h59l7 100H74Z" fill="#d5b994" /><path d="M82 23h59l-2 12H81Z" fill="#b29978" /><path d="M79 54h64l3 55H76Z" fill="#3c6355" /><text x="110" y="72" textAnchor="middle" fill="#f6e5c6" fontSize="8" fontWeight="800">NEIGHBORHOOD</text><text x="110" y="85" textAnchor="middle" fill="#f6e5c6" fontSize="12" fontWeight="800">COFFEE</text><text x="110" y="99" textAnchor="middle" fill="#f6e5c6" fontSize="6">SOUTH INDIAN FILTER</text><path d="M94 115h31" stroke="#b79970" strokeWidth="2" />
        <ellipse cx="153" cy="126" rx="7" ry="4" fill="#694e36" transform="rotate(-25 153 126)" /><path d="m150 128 5-4" stroke="#b3997b" />
      </>}
    </svg>
  </div>;
}
