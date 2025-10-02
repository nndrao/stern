/**
 * Icon Picker Component
 * Dialog for selecting icons for menu items
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { buildUrl } from '@/openfin-utils';
import {
  Search,
  Grid3x3,
  LayoutDashboard,
  LineChart,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  Settings,
  Sliders,
  Database,
  Server,
  Cloud,
  Globe,
  Lock,
  Shield,
  Bell,
  Calendar,
  Clock,
  FileText,
  Folder,
  File,
  Save,
  Download,
  Upload,
  Share2,
  Link,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Copy,
  Clipboard,
  Filter,
  SortAsc,
  SortDesc,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Home,
  Inbox,
  Send,
  Archive,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Mail,
  Phone,
  Video,
  Mic,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Tag,
  Hash,
  Percent,
  Activity,
  Airplay,
  AlertTriangle,
  Aperture,
  Award,
  BarChart,
  Battery,
  Bluetooth,
  Book,
  Box,
  Briefcase,
  Camera,
  Cast,
  Compass,
  Cpu,
  CreditCard,
  Crosshair,
  Disc,
  Feather,
  Film,
  Flag,
  Gift,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Github,
  Gitlab,
  HardDrive,
  Headphones,
  Image,
  Key,
  Layers,
  Layout,
  LifeBuoy,
  Loader,
  LogIn,
  LogOut,
  Map,
  MapPin,
  Monitor,
  Moon,
  Move,
  Music,
  Navigation,
  Package2,
  Paperclip,
  PenTool,
  Pocket,
  Power,
  Printer,
  Radio,
  Rss,
  Scissors,
  Search as SearchIcon,
  Server as ServerIcon,
  Share,
  ShoppingBag,
  Sidebar,
  Smartphone,
  Speaker,
  Sun,
  Sunrise,
  Sunset,
  Tablet,
  Target,
  Terminal,
  Thermometer,
  Trash,
  Tv,
  Type,
  Umbrella,
  Underline,
  Unlock,
  UserMinus,
  UserPlus,
  UserX,
  Voicemail,
  Wifi,
  Wind,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (icon: string) => void;
}

// Icon categories with their icons
const iconCategories = {
  common: [
    { name: 'Grid', icon: Grid3x3, path: '/icons/grid.svg' },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/icons/dashboard.svg' },
    { name: 'Chart', icon: LineChart, path: '/icons/chart.svg' },
    { name: 'Bar Chart', icon: BarChart3, path: '/icons/bar-chart.svg' },
    { name: 'Pie Chart', icon: PieChart, path: '/icons/pie-chart.svg' },
    { name: 'Settings', icon: Settings, path: '/icons/settings.svg' },
    { name: 'Database', icon: Database, path: '/icons/database.svg' },
    { name: 'Users', icon: Users, path: '/icons/users.svg' },
    { name: 'File', icon: FileText, path: '/icons/file.svg' },
    { name: 'Folder', icon: Folder, path: '/icons/folder.svg' },
  ],
  trading: [
    { name: 'Trending Up', icon: TrendingUp, path: '/icons/trending-up.svg' },
    { name: 'Dollar', icon: DollarSign, path: '/icons/dollar.svg' },
    { name: 'Package', icon: Package, path: '/icons/package.svg' },
    { name: 'Shopping Cart', icon: ShoppingCart, path: '/icons/cart.svg' },
    { name: 'Bar Chart', icon: BarChart, path: '/icons/bar-chart-2.svg' },
    { name: 'Activity', icon: Activity, path: '/icons/activity.svg' },
    { name: 'Credit Card', icon: CreditCard, path: '/icons/credit-card.svg' },
    { name: 'Briefcase', icon: Briefcase, path: '/icons/briefcase.svg' },
    { name: 'Target', icon: Target, path: '/icons/target.svg' },
    { name: 'Award', icon: Award, path: '/icons/award.svg' },
  ],
  actions: [
    { name: 'Plus', icon: Plus, path: '/icons/plus.svg' },
    { name: 'Minus', icon: Minus, path: '/icons/minus.svg' },
    { name: 'Edit', icon: Edit2, path: '/icons/edit.svg' },
    { name: 'Delete', icon: Trash2, path: '/icons/delete.svg' },
    { name: 'Copy', icon: Copy, path: '/icons/copy.svg' },
    { name: 'Save', icon: Save, path: '/icons/save.svg' },
    { name: 'Download', icon: Download, path: '/icons/download.svg' },
    { name: 'Upload', icon: Upload, path: '/icons/upload.svg' },
    { name: 'Share', icon: Share2, path: '/icons/share.svg' },
    { name: 'Refresh', icon: RefreshCw, path: '/icons/refresh.svg' },
  ],
  navigation: [
    { name: 'Home', icon: Home, path: '/icons/home.svg' },
    { name: 'Search', icon: SearchIcon, path: '/icons/search.svg' },
    { name: 'Menu', icon: Menu, path: '/icons/menu.svg' },
    { name: 'External Link', icon: ExternalLink, path: '/icons/external.svg' },
    { name: 'Maximize', icon: Maximize2, path: '/icons/maximize.svg' },
    { name: 'Minimize', icon: Minimize2, path: '/icons/minimize.svg' },
    { name: 'Chevron Up', icon: ChevronUp, path: '/icons/chevron-up.svg' },
    { name: 'Chevron Down', icon: ChevronDown, path: '/icons/chevron-down.svg' },
    { name: 'Chevron Left', icon: ChevronLeft, path: '/icons/chevron-left.svg' },
    { name: 'Chevron Right', icon: ChevronRight, path: '/icons/chevron-right.svg' },
  ],
  status: [
    { name: 'Check', icon: Check, path: '/icons/check.svg' },
    { name: 'X', icon: X, path: '/icons/x.svg' },
    { name: 'Alert Circle', icon: AlertCircle, path: '/icons/alert.svg' },
    { name: 'Info', icon: Info, path: '/icons/info.svg' },
    { name: 'Help', icon: HelpCircle, path: '/icons/help.svg' },
    { name: 'Bell', icon: Bell, path: '/icons/bell.svg' },
    { name: 'Lock', icon: Lock, path: '/icons/lock.svg' },
    { name: 'Unlock', icon: Unlock, path: '/icons/unlock.svg' },
    { name: 'Shield', icon: Shield, path: '/icons/shield.svg' },
    { name: 'Eye', icon: Eye, path: '/icons/eye.svg' },
  ],
  media: [
    { name: 'Play', icon: Play, path: '/icons/play.svg' },
    { name: 'Pause', icon: Pause, path: '/icons/pause.svg' },
    { name: 'Volume', icon: Volume2, path: '/icons/volume.svg' },
    { name: 'Mic', icon: Mic, path: '/icons/mic.svg' },
    { name: 'Video', icon: Video, path: '/icons/video.svg' },
    { name: 'Camera', icon: Camera, path: '/icons/camera.svg' },
    { name: 'Image', icon: Image, path: '/icons/image.svg' },
    { name: 'Film', icon: Film, path: '/icons/film.svg' },
    { name: 'Music', icon: Music, path: '/icons/music.svg' },
    { name: 'Headphones', icon: Headphones, path: '/icons/headphones.svg' },
  ]
};

export const IconPicker: React.FC<IconPickerProps> = ({
  open,
  onOpenChange,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleSelectIcon = (path: string) => {
    setSelectedIcon(path);
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelect(selectedIcon);
      onOpenChange(false);
      setSelectedIcon(null);
      setSearchTerm('');
      setCustomUrl('');
    }
  };

  const handleCustomUrl = () => {
    if (customUrl) {
      onSelect(customUrl);
      onOpenChange(false);
      setCustomUrl('');
    }
  };

  const filterIcons = (icons: typeof iconCategories.common) => {
    if (!searchTerm) return icons;
    return icons.filter(icon =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderIconGrid = (icons: typeof iconCategories.common) => {
    const filtered = filterIcons(icons);

    if (filtered.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No icons found
        </div>
      );
    }

    return (
      <div className="grid grid-cols-6 gap-2">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={selectedIcon === item.path ? 'secondary' : 'outline'}
              className="h-16 w-16 p-0 flex flex-col items-center justify-center gap-1"
              onClick={() => handleSelectIcon(item.path)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs truncate w-full px-1">{item.name}</span>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
          <DialogDescription>
            Choose an icon for your menu item or provide a custom URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="common" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="common">Common</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="common" className="p-2">
                {renderIconGrid(iconCategories.common)}
              </TabsContent>
              <TabsContent value="trading" className="p-2">
                {renderIconGrid(iconCategories.trading)}
              </TabsContent>
              <TabsContent value="actions" className="p-2">
                {renderIconGrid(iconCategories.actions)}
              </TabsContent>
              <TabsContent value="navigation" className="p-2">
                {renderIconGrid(iconCategories.navigation)}
              </TabsContent>
              <TabsContent value="status" className="p-2">
                {renderIconGrid(iconCategories.status)}
              </TabsContent>
              <TabsContent value="media" className="p-2">
                {renderIconGrid(iconCategories.media)}
              </TabsContent>
              <TabsContent value="custom" className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customUrl">Custom Icon URL</Label>
                  <Input
                    id="customUrl"
                    placeholder="/icons/custom.svg or https://example.com/icon.png"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a relative path or full URL to your custom icon
                  </p>
                </div>
                <Button
                  onClick={handleCustomUrl}
                  disabled={!customUrl}
                  className="w-full"
                >
                  Use Custom Icon
                </Button>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedIcon}>
            Select Icon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};