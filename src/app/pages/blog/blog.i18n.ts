import type { Locale } from '../../services/locale.service';

/**
 * Blog-specific UI strings + meta, per locale. Kept here (not in the global
 * i18n Translations interface) because it's blog-feature copy used only by
 * BlogComponent and BlogDetailComponent. The blog content itself lives in the
 * per-locale data files; this is just the surrounding chrome and the listing
 * page meta. `og`/`html` locale codes come from LocaleService.
 */
export interface BlogUiCopy {
  /** /blog listing meta. */
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  /** Listing page chrome. */
  h1: string;
  intro: string;
  readMore: string;
  minRead: string;
  empty: string;
  /** Blog @graph node copy. */
  blogName: string;
  blogDescription: string;
  /** Detail page chrome. */
  by: string;
  breadcrumbHome: string;
  breadcrumbBlog: string;
  originallySharedPre: string;
  originallySharedLink: string;
  originallySharedPost: string;
  ctaPrompt: string;
  ctaTours: string;
  ctaContact: string;
  back: string;
  /** Missing-post fallback. */
  notFoundMetaTitle: string;
  notFoundMetaDescription: string;
  notFoundHeading: string;
  notFoundBody: string;
  notFoundBrowse: string;
}

export const BLOG_UI: Record<Locale, BlogUiCopy> = {
  en: {
    metaTitle: 'Bansko Unlocked Blog | Adventure Guides & Things to Do in Bansko',
    metaDescription:
      'Guides, tips and stories about adventure activities in Bansko, Bulgaria — ATV & buggy tours, the shooting range, mountain camping and winter snow riding.',
    metaKeywords:
      'bansko blog, things to do in bansko, bansko adventure guides, bansko atv tips, pirin mountains activities',
    h1: 'Bansko Unlocked Blog',
    intro:
      'Guides, tips and stories about the best adventure activities in and around Bansko — straight from our team in the Pirin Mountains.',
    readMore: 'Read more →',
    minRead: 'min read',
    empty: 'No posts yet — check back soon.',
    blogName: 'Bansko Unlocked Blog',
    blogDescription:
      'Guides, tips and stories about adventure activities in Bansko, Bulgaria — ATV & buggy tours, shooting, camping and snow riding.',
    by: 'By',
    breadcrumbHome: 'Home',
    breadcrumbBlog: 'Blog',
    originallySharedPre: 'Originally shared on',
    originallySharedLink: 'our Facebook page',
    originallySharedPost: '.',
    ctaPrompt: 'Ready for your Bansko adventure?',
    ctaTours: 'See activities',
    ctaContact: 'Get in touch',
    back: '← Back to all posts',
    notFoundMetaTitle: 'Post Not Found | Bansko Unlocked Blog',
    notFoundMetaDescription: 'The blog post you were looking for does not exist.',
    notFoundHeading: 'Post Not Found',
    notFoundBody: "This blog post doesn't exist or has been moved.",
    notFoundBrowse: 'Browse all posts',
  },
};
