import { 
  Globe, 
  Calendar, 
  ReceiptText, 
  Calculator, 
  Handshake, 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  ArrowLeft,
  Building2, 
  Plane, 
  UtensilsCrossed, 
  Bell, 
  ChevronRight, 
  Plus, 
  Check, 
  Users, 
  Sparkles,
  ShoppingBag,
  Coffee,
  DollarSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Search,
  CreditCard,
  LogOut,
  X,
  Wallet,
  Trash2,
  TrendingUp,
  UserCheck,
  ChevronDown,
  Link2,
  Copy,
  ClipboardCheck,
  Delete,
  Wine,
  Utensils,
  GripVertical,
  Inbox,
  CheckCircle2,
  Settings,
  RefreshCw
} from 'lucide-react';

// Custom Bowling Ball Icon matching screenshot
export const BowlingIcon = ({ size = 20, color = "currentColor", className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="10" cy="9" r="1.2" fill={color} />
    <circle cx="14" cy="9" r="1.2" fill={color} />
    <circle cx="12" cy="13.5" r="1.2" fill={color} />
  </svg>
);

// Receipt Icon for Itemized Ambagan
export const ReceiptIcon = ({ size = 22, color = "#1E2026", className = "" }) => (
  <ReceiptText size={size} color={color} className={className} strokeWidth={1.8} />
);

// Calculator Icon for Auto-Balance
export const CalculatorIcon = ({ size = 22, color = "#1E2026", className = "" }) => (
  <Calculator size={size} color={color} className={className} strokeWidth={1.8} />
);

// Handshake Icon for Easy Settle-Up
export const HandshakeIcon = ({ size = 22, color = "#1E2026", className = "" }) => (
  <Handshake size={size} color={color} className={className} strokeWidth={1.8} />
);

export {
  Globe,
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Handshake,
  Building2,
  Plane,
  UtensilsCrossed,
  Bell,
  ChevronRight,
  Plus,
  Check,
  Users,
  Sparkles,
  ShoppingBag,
  Coffee,
  DollarSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Search,
  CreditCard,
  LogOut,
  X,
  Wallet,
  ReceiptText,
  Trash2,
  TrendingUp,
  UserCheck,
  ChevronDown,
  Link2,
  Copy,
  ClipboardCheck,
  Delete,
  Wine,
  Utensils,
  GripVertical,
  Inbox,
  CheckCircle2,
  Settings,
  RefreshCw
};
