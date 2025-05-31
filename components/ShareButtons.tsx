// app/components/ShareButtons.tsx
'use client';

import { 
  FacebookShareButton, FacebookIcon,
  PinterestShareButton, PinterestIcon,
  TwitterShareButton, TwitterIcon,
  TumblrIcon
} from 'react-share';

type ShareButtonsProps = { 
 
  imageUrl: string;
  title: string;
  description: string;
  hashtags: string;
};

export default function ShareButtons({ 
  
  imageUrl, 
  title, 
  description, 
  hashtags 
}: ShareButtonsProps) {
  // Convert hashtags for different platforms
  const hashtagsArray = hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.substring(1));

  const tumblrShareUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(imageUrl)}&title=${encodeURIComponent(title)}&caption=${encodeURIComponent(`${description || ''} ${hashtags}`)}`;

  return (
    <div className="flex flex-wrap gap-4" >
      <FacebookShareButton url={imageUrl} hashtag={`${title} ${description} ${hashtags}`} >
        <div className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
          <FacebookIcon size={24} round />
          <span>Share on Facebook</span>
        </div>
      </FacebookShareButton>
      
      <PinterestShareButton url={imageUrl} media={imageUrl} description={`${title} ${description} ${hashtags}`}>
        <div className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2">
          <PinterestIcon size={24} round />
          <span>Share on Pinterest</span>
        </div>
      </PinterestShareButton>
      
      
      
      <TwitterShareButton url={description}  hashtags={hashtagsArray}>
        <div className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 flex items-center gap-2">
          <TwitterIcon size={24} round />
          <span>Share on Twitter</span>
        </div>
      </TwitterShareButton>
    
      
      <a target='_blank' href={tumblrShareUrl}>
        <div className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 flex items-center gap-2">
          <TumblrIcon size={24} round />
          <span>Share on Tumblr</span>
        </div>
      </a>
    </div>
  );
}