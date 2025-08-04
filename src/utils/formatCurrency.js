export default function formatCurrency(amount) {
  return `Rs ${Number(amount).toLocaleString("en-PK")}`;
}
