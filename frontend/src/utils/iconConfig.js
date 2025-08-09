// Icon configuration for the AlgoVerse application
import {
  // Navigation & Layout
  Home,
  BookOpen,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  
  // Algorithm & Problem Icons
  Code2,
  Cpu,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Layers,
  GitBranch,
  Binary,
  
  // User & Profile Icons
  User,
  UserCircle,
  UserCheck,
  Crown,
  Award,
  Trophy,
  Medal,
  Star,
  
  // Blog & Content Icons
  FileText,
  Edit3,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Calendar,
  
  // Admin & Management Icons
  Shield,
  Database,
  BarChart,
  PieChart,
  TrendingDown,
  Users2,
  FileBarChart,
  Settings2,
  
  // Actions & States
  Plus,
  Minus,
  Check,
  CheckCircle,
  X as XIcon,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  
  // Progress & Status
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RotateCcw,
  RefreshCw,
  Download,
  Upload,
  
  // External & Links
  ExternalLink,
  Link,
  Globe,
  Github,
  Mail,
  Phone,
  MapPin,
  
  // Search & Filter
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  
  // Theme & Display
  Sun,
  Moon,
  Monitor,
  Palette,
  
  // Difficulty & Platform Icons
  Flame,
  Zap as Lightning,
  Mountain,
  Sparkles,
  
  // Learning Path Icons
  Route,
  Map,
  Compass,
  Flag,
  Milestone,
  
  // Communication
  Bell,
  BellRing,
  Send,
  Reply,
  Forward,
  
  // File & Data
  File,
  Folder,
  Save,
  Trash2,
  Archive,
  
  // Time & Date
  Timer,
  Stopwatch,
  CalendarDays,
  
  // Security & Auth
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  
  // Feedback & Rating
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  
  // Navigation Arrows
  ChevronLeft,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  
  // Special Actions
  Copy,
  Scissors,
  Clipboard,
  
  // Status Indicators
  Wifi,
  WifiOff,
  Signal,
  
  // Math & Logic
  Calculator,
  Hash,
  Percent,
  
  // Code & Development
  Terminal,
  Code,
  Braces,
  
  // Learning & Education
  GraduationCap,
  BookMarked,
  Library,
  
  // Performance & Analytics
  Gauge,
  LineChart,
  
  // Social & Sharing
  Share,
  UserPlus,
  UserMinus,
  
  // Miscellaneous
  Puzzle,
  Lightbulb,
  Rocket,
  Gamepad2
} from 'lucide-react';

// Icon mapping for different contexts
export const iconConfig = {
  // Navigation Icons
  navigation: {
    home: Home,
    algorithms: Code2,
    problems: Target,
    blogs: FileText,
    profile: UserCircle,
    admin: Shield,
    settings: Settings,
    menu: Menu,
    close: X,
    back: ArrowLeft,
    forward: ArrowRight,
    expand: ChevronDown,
    collapse: ChevronRight
  },

  // Algorithm & Problem Icons
  algorithms: {
    sorting: BarChart3,
    searching: Search,
    graph: GitBranch,
    tree: Layers,
    dynamic: Zap,
    greedy: TrendingUp,
    backtrack: RotateCcw,
    divide: Binary,
    string: FileText,
    array: Grid,
    linkedlist: Link,
    stack: Layers,
    queue: ArrowRight,
    heap: Mountain,
    hash: Hash,
    math: Calculator,
    geometry: Compass,
    bit: Binary,
    recursion: RefreshCw,
    implementation: Code
  },

  // Difficulty Icons
  difficulty: {
    beginner: Sparkles,
    easy: CheckCircle,
    medium: Flame,
    hard: Mountain,
    expert: Crown
  },

  // Platform Icons
  platforms: {
    leetcode: Code2,
    codeforces: Target,
    atcoder: Cpu,
    codechef: Gamepad2,
    hackerrank: Terminal,
    spoj: Globe,
    uva: BookOpen,
    hackerearth: Rocket,
    topcoder: Trophy,
    geeksforgeeks: GraduationCap
  },

  // Status Icons
  status: {
    solved: CheckCircle,
    attempted: Clock,
    notStarted: AlertCircle,
    inProgress: PlayCircle,
    paused: PauseCircle,
    completed: Trophy,
    approved: Check,
    pending: Clock,
    rejected: XCircle,
    draft: Edit3
  },

  // User & Profile Icons
  user: {
    profile: UserCircle,
    admin: Crown,
    moderator: Shield,
    user: User,
    guest: UserCheck,
    online: CheckCircle,
    offline: XCircle,
    verified: ShieldCheck,
    premium: Star
  },

  // Blog & Content Icons
  blog: {
    article: FileText,
    draft: Edit3,
    published: Eye,
    featured: Star,
    comment: MessageCircle,
    like: Heart,
    share: Share2,
    bookmark: Bookmark,
    view: Eye,
    edit: Edit3,
    delete: Trash2,
    create: Plus
  },

  // Admin & Analytics Icons
  admin: {
    dashboard: BarChart,
    users: Users2,
    content: FileBarChart,
    analytics: TrendingUp,
    settings: Settings2,
    database: Database,
    reports: PieChart,
    logs: List,
    security: ShieldCheck,
    backup: Archive
  },

  // Actions Icons
  actions: {
    add: Plus,
    remove: Minus,
    edit: Edit3,
    delete: Trash2,
    save: Save,
    cancel: X,
    confirm: Check,
    copy: Copy,
    paste: Clipboard,
    cut: Scissors,
    download: Download,
    upload: Upload,
    refresh: RefreshCw,
    reset: RotateCcw,
    search: Search,
    filter: Filter,
    sort: SortAsc,
    view: Eye,
    hide: EyeOff,
    expand: ChevronDown,
    collapse: ChevronUp,
    next: ChevronRight,
    previous: ChevronLeft,
    external: ExternalLink,
    link: Link,
    share: Share,
    reply: Reply,
    forward: Forward,
    send: Send
  },

  // Progress & Learning Icons
  progress: {
    start: PlayCircle,
    pause: PauseCircle,
    stop: StopCircle,
    complete: CheckCircle,
    milestone: Flag,
    path: Route,
    map: Map,
    compass: Compass,
    trophy: Trophy,
    medal: Medal,
    award: Award,
    star: Star,
    level: TrendingUp,
    streak: Flame,
    achievement: Crown
  },

  // Theme & UI Icons
  theme: {
    light: Sun,
    dark: Moon,
    auto: Monitor,
    palette: Palette
  },

  // Communication Icons
  communication: {
    message: MessageCircle,
    chat: MessageSquare,
    notification: Bell,
    alert: BellRing,
    email: Mail,
    phone: Phone,
    feedback: ThumbsUp,
    support: HelpCircle,
    faq: Info
  },

  // Time & Date Icons
  time: {
    clock: Clock,
    timer: Timer,
    stopwatch: Stopwatch,
    calendar: Calendar,
    date: CalendarDays,
    schedule: Clock
  },

  // File & Data Icons
  file: {
    file: File,
    folder: Folder,
    code: Code2,
    text: FileText,
    data: Database,
    chart: BarChart3,
    report: FileBarChart
  },

  // Learning Path Icons
  learning: {
    path: Route,
    course: BookOpen,
    lesson: BookMarked,
    quiz: HelpCircle,
    assignment: Edit3,
    project: Folder,
    certificate: Award,
    graduation: GraduationCap,
    library: Library,
    study: BookOpen
  },

  // Performance Icons
  performance: {
    speed: Zap,
    efficiency: TrendingUp,
    optimization: Gauge,
    benchmark: BarChart3,
    metrics: LineChart,
    analysis: Activity,
    comparison: BarChart,
    improvement: TrendingUp
  },

  // Special Features
  features: {
    ai: Sparkles,
    smart: Lightbulb,
    auto: RefreshCw,
    manual: Edit3,
    guided: Compass,
    interactive: Gamepad2,
    collaborative: Users,
    personalized: User,
    adaptive: TrendingUp,
    gamified: Trophy
  }
};

// Helper function to get icon by category and name
export const getIcon = (category, name, fallback = AlertCircle) => {
  try {
    return iconConfig[category]?.[name] || fallback;
  } catch (error) {
    console.warn(`Icon not found: ${category}.${name}`);
    return fallback;
  }
};

// Helper function to get all icons in a category
export const getCategoryIcons = (category) => {
  return iconConfig[category] || {};
};

// Export commonly used icon sets
export const navIcons = iconConfig.navigation;
export const algoIcons = iconConfig.algorithms;
export const statusIcons = iconConfig.status;
export const actionIcons = iconConfig.actions;
export const userIcons = iconConfig.user;
export const blogIcons = iconConfig.blog;
export const adminIcons = iconConfig.admin;
export const progressIcons = iconConfig.progress;
export const themeIcons = iconConfig.theme;

// Default export
export default iconConfig;