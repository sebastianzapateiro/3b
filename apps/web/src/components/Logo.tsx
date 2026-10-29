/** Monograma 3B con los tres puntos + wordmark "LasTresB". Vectores de logos-Las3B_banco-de-imagenes/svg. */
const TRES =
  "M646 -24C994 -24 1235 164 1235 420C1235 598 1114 751 898 776V779C1066 807 1189 924 1189 1099C1189 1342 963 1514 646 1514C302 1514 90 1310 90 1038H427C427 1164 517 1248 646 1248C770 1248 857 1171 857 1059C857 950 766 884 618 884H480V632H618C776 632 879 558 879 444C879 328 783 250 643 250C492 250 401 344 401 501H61C61 220 248 -24 646 -24Z";
const B =
  "M96 0H761C1092 0 1279 174 1279 421C1279 632 1136 768 950 780V782C1118 819 1227 940 1227 1112C1227 1335 1047 1490 716 1490H96ZM447 276V623H704C833 623 912 555 912 447C912 340 832 276 702 276ZM447 885V1214H682C797 1214 868 1150 868 1050C868 949 797 885 682 885Z";

export function Monograma({ oscuro = false, className }: { oscuro?: boolean; className?: string }) {
  return (
    <svg viewBox="4 -182 382 188" className={className} aria-hidden="true">
      <path transform="translate(1.92 0) scale(0.11719 -0.11719)" d={TRES} fill={oscuro ? "#FBF7F0" : "#1B2623"} />
      <path transform="translate(145.54 0) scale(0.11719 -0.11719)" d={B} fill={oscuro ? "#E4694B" : "#C2452D"} />
      <circle cx="363.69" cy="-148.8" r="18" fill={oscuro ? "#3FB394" : "#0F6B5C"} />
      <circle cx="363.69" cy="-88.8" r="18" fill={oscuro ? "#E4694B" : "#C2452D"} />
      <circle cx="363.69" cy="-28.8" r="18" fill="#F5B700" />
    </svg>
  );
}

export function Logo({ oscuro = false, className }: { oscuro?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Monograma oscuro={oscuro} className="h-6 w-auto" />
      <span className="font-display text-[22px] font-extrabold tracking-tight">
        LasTres<span className={oscuro ? "text-ladrillo-claro" : "text-ladrillo"}>B</span>
      </span>
      <span className="sr-only">LasTresB</span>
    </span>
  );
}
