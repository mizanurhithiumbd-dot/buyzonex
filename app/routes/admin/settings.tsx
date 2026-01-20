import { useState, useEffect } from "react";
import { redirectToLogin, redirectWithHeaders } from "~/lib/redirect.server";
import { AdminLayout } from "~/components/admin-layout/admin-layout";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs/tabs";
import { Settings as SettingsIcon, Palette, Layout } from "lucide-react";
import type { Route } from "./+types/settings";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import styles from "./settings.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Manaf Zone Admin" },
    { name: "description", content: "Configure site settings" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirectToLogin(request, headers);
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return redirectWithHeaders(headers, '/');
  }
  
  // Don't return Headers objects (not serializable). We only need the loader to
  // guard access; the component doesn't depend on loader data.
  return null;
}

interface SiteSettings {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  currency_symbol: string;
  free_shipping_threshold: number;
  tax_rate: number;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: "Manaf Zone",
    site_tagline: "Your one-stop shop for everything",
    contact_email: "support@shophub.com",
    contact_phone: "+880 1234 567890",
    currency_symbol: "৳",
    free_shipping_threshold: 2000,
    tax_rate: 0,
  });

  const [themeSettings, setThemeSettings] = useState({
    primary_color: "#6366f1",
    accent_color: "#8b5cf6",
    neutral_color: "#64748b",
  });

  const [featureToggles, setFeatureToggles] = useState({
    enable_wishlist: true,
    enable_reviews: true,
    enable_loyalty_program: false,
    enable_coupons: true,
  });

  useEffect(() => {
    // Settings are using in-memory state
    // No need to load from external source
  }, []);

  const handleSaveSiteSettings = async () => {
    try {
      setLoading(true);
      setSaveStatus("Saving...");
      
      // In a real app, save to database here
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("Error saving settings");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThemeSettings = async () => {
    try {
      setLoading(true);
      setSaveStatus("Saving...");
      
      // In a real app, save to database and update CSS variables
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveStatus("Theme updated successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving theme:", error);
      setSaveStatus("Error saving theme");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeatureToggles = async () => {
    try {
      setLoading(true);
      setSaveStatus("Saving...");
      
      // In a real app, save to feature_flags table
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveStatus("Features updated successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving features:", error);
      setSaveStatus("Error saving features");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Settings"
      subtitle="Configure your store settings and preferences"
    >
      {saveStatus && (
        <div className={`${styles.statusBanner} ${saveStatus.includes("Error") ? styles.error : styles.success}`}>
          {saveStatus}
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="general">
            <SettingsIcon size={16} />
            General
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette size={16} />
            Theme
          </TabsTrigger>
          <TabsTrigger value="features">
            <Layout size={16} />
            Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className={styles.tabContent}>
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>General Settings</h3>
            <p className={styles.sectionDescription}>
              Configure basic site information and operational settings
            </p>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>Site Name</label>
                <Input
                  type="text"
                  value={siteSettings.site_name}
                  onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                  placeholder="Enter site name"
                />
              </div>

              <div className={styles.formField}>
                <label>Site Tagline</label>
                <Input
                  type="text"
                  value={siteSettings.site_tagline}
                  onChange={(e) => setSiteSettings({ ...siteSettings, site_tagline: e.target.value })}
                  placeholder="Enter site tagline"
                />
              </div>

              <div className={styles.formField}>
                <label>Contact Email</label>
                <Input
                  type="email"
                  value={siteSettings.contact_email}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>

              <div className={styles.formField}>
                <label>Contact Phone</label>
                <Input
                  type="tel"
                  value={siteSettings.contact_phone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact_phone: e.target.value })}
                  placeholder="+880 1234 567890"
                />
              </div>

              <div className={styles.formField}>
                <label>Currency Symbol</label>
                <Input
                  type="text"
                  value={siteSettings.currency_symbol}
                  onChange={(e) => setSiteSettings({ ...siteSettings, currency_symbol: e.target.value })}
                  placeholder="৳"
                />
              </div>

              <div className={styles.formField}>
                <label>Free Shipping Threshold (৳)</label>
                <Input
                  type="number"
                  value={siteSettings.free_shipping_threshold}
                  onChange={(e) => setSiteSettings({ ...siteSettings, free_shipping_threshold: parseFloat(e.target.value) })}
                  placeholder="2000"
                />
              </div>

              <div className={styles.formField}>
                <label>Tax Rate (%)</label>
                <Input
                  type="number"
                  value={siteSettings.tax_rate}
                  onChange={(e) => setSiteSettings({ ...siteSettings, tax_rate: parseFloat(e.target.value) })}
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button onClick={handleSaveSiteSettings} disabled={loading}>
                Save General Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="theme" className={styles.tabContent}>
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Theme Settings</h3>
            <p className={styles.sectionDescription}>
              Customize the look and feel of your store
            </p>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>Primary Color</label>
                <div className={styles.colorInput}>
                  <Input
                    type="color"
                    value={themeSettings.primary_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                    className={styles.colorPicker}
                  />
                  <Input
                    type="text"
                    value={themeSettings.primary_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Accent Color</label>
                <div className={styles.colorInput}>
                  <Input
                    type="color"
                    value={themeSettings.accent_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                    className={styles.colorPicker}
                  />
                  <Input
                    type="text"
                    value={themeSettings.accent_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Neutral Color</label>
                <div className={styles.colorInput}>
                  <Input
                    type="color"
                    value={themeSettings.neutral_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, neutral_color: e.target.value })}
                    className={styles.colorPicker}
                  />
                  <Input
                    type="text"
                    value={themeSettings.neutral_color}
                    onChange={(e) => setThemeSettings({ ...themeSettings, neutral_color: e.target.value })}
                    placeholder="#64748b"
                  />
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button onClick={handleSaveThemeSettings} disabled={loading}>
                Save Theme Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className={styles.tabContent}>
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Feature Toggles</h3>
            <p className={styles.sectionDescription}>
              Enable or disable features across your store
            </p>

            <div className={styles.featureToggles}>
              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <h4>Wishlist</h4>
                  <p>Allow customers to save products for later</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={featureToggles.enable_wishlist}
                    onChange={(e) => setFeatureToggles({ ...featureToggles, enable_wishlist: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <h4>Product Reviews</h4>
                  <p>Enable customer reviews and ratings</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={featureToggles.enable_reviews}
                    onChange={(e) => setFeatureToggles({ ...featureToggles, enable_reviews: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <h4>Loyalty Program</h4>
                  <p>Reward customers with points and perks</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={featureToggles.enable_loyalty_program}
                    onChange={(e) => setFeatureToggles({ ...featureToggles, enable_loyalty_program: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <h4>Coupons & Discounts</h4>
                  <p>Allow discount codes and promotional offers</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={featureToggles.enable_coupons}
                    onChange={(e) => setFeatureToggles({ ...featureToggles, enable_coupons: e.target.checked })}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button onClick={handleSaveFeatureToggles} disabled={loading}>
                Save Feature Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
