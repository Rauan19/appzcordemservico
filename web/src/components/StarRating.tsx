import "./StarRating.css";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  readonly?: boolean;
};

export function StarRating({ value, onChange, size = "md", readonly }: Props) {
  return (
    <div className={`star-rating star-rating-${size}`} role={readonly ? "img" : "group"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? "star filled" : "star"}
          disabled={readonly || !onChange}
          onClick={() => onChange?.(star)}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function formatRating(value: number) {
  return value.toFixed(1).replace(".0", "");
}
