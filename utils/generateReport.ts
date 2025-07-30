import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

type AnalyticsData = {
  channelInfo?: {
    title: string;
    statistics: {
      viewCount: string;
      subscriberCount: string;
      videoCount: string;
    };
  };
  timeSeriesData?: {
    rows: (string | number)[][];
    columnHeaders: { name: string; columnType: string; dataType: string }[];
  };
  topVideos?: {
    rows: (string | number)[][];
    videoDetails: { id: string; snippet?: { title?: string } }[];
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
};

type FacebookPageData = {
  pageName: string;
  insights: {
    name: string;
    values: { value: number; end_time?: string }[];
  }[];
  posts: {
    message?: string;
    created_time: string;
    insights?: { data: { name: string; values: { value: number }[] }[] };
  }[];
};

export const generateYouTubeReport = async (
  analyticsData: AnalyticsData | null,
  chartRefs: {
    views: HTMLDivElement | null;
    watchTime: HTMLDivElement | null;
    engagement: HTMLDivElement | null;
  }
): Promise<void> => {
  const pdf = new jsPDF();
  let yOffset = 20;

  // Title
  pdf.setFontSize(20);
  pdf.text("YouTube Analytics Report", 20, yOffset);
  yOffset += 10;

  // Date Range
  if (analyticsData?.dateRange) {
    pdf.setFontSize(12);
    pdf.text(
      `Date Range: ${format(
        new Date(analyticsData.dateRange.startDate),
        "MMM dd, yyyy"
      )} - ${format(
        new Date(analyticsData.dateRange.endDate),
        "MMM dd, yyyy"
      )}`,
      20,
      yOffset
    );
    yOffset += 10;
  }

  // Channel Info
  if (analyticsData?.channelInfo) {
    pdf.setFontSize(16);
    pdf.text(`Channel: ${analyticsData.channelInfo.title}`, 20, yOffset);
    yOffset += 10;
    pdf.setFontSize(12);
    pdf.text(
      `Total Views: ${Number(
        analyticsData.channelInfo.statistics.viewCount
      ).toLocaleString()}`,
      20,
      yOffset
    );
    yOffset += 10;
    pdf.text(
      `Subscribers: ${Number(
        analyticsData.channelInfo.statistics.subscriberCount
      ).toLocaleString()}`,
      20,
      yOffset
    );
    yOffset += 10;
    pdf.text(
      `Videos: ${Number(
        analyticsData.channelInfo.statistics.videoCount
      ).toLocaleString()}`,
      20,
      yOffset
    );
    yOffset += 20;
  }

  // Charts
  const captureChart = async (
    ref: HTMLDivElement | null,
    title: string
  ): Promise<void> => {
    if (ref) {
      const canvas = await html2canvas(ref, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (yOffset + imgHeight > 280) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.setFontSize(14);
      pdf.text(title, 20, yOffset);
      yOffset += 10;
      pdf.addImage(imgData, "PNG", 20, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;
    }
  };

  await captureChart(chartRefs.views, "Views Over Time");
  await captureChart(chartRefs.watchTime, "Watch Time (Minutes)");
  await captureChart(chartRefs.engagement, "Engagement");

  // Top Videos
  if (
    analyticsData?.topVideos?.rows &&
    analyticsData.topVideos.rows.length > 0
  ) {
    pdf.setFontSize(14);
    pdf.text("Top Videos", 20, yOffset);
    yOffset += 10;
    pdf.setFontSize(10);
    const headers = ["Title", "Views", "Watch Time (min)", "Likes", "Comments"];
    const columnWidths = [80, 30, 30, 20, 20];
    let xOffset = 20;
    headers.forEach((header, index) => {
      pdf.text(header, xOffset, yOffset);
      xOffset += columnWidths[index];
    });
    yOffset += 10;

    analyticsData.topVideos.rows.forEach((row, index) => {
      const videoId = row[0] as string;
      const videoDetails = analyticsData.topVideos?.videoDetails?.find(
        (v) => v.id === videoId
      );
      xOffset = 20;
      pdf.text(videoDetails?.snippet?.title || videoId, xOffset, yOffset, {
        maxWidth: columnWidths[0],
      });
      xOffset += columnWidths[0];
      pdf.text(Number(row[1]).toLocaleString(), xOffset, yOffset);
      xOffset += columnWidths[1];
      pdf.text(Number(row[2]).toLocaleString(), xOffset, yOffset);
      xOffset += columnWidths[2];
      pdf.text(Number(row[3]).toLocaleString(), xOffset, yOffset);
      xOffset += columnWidths[3];
      pdf.text(Number(row[4]).toLocaleString(), xOffset, yOffset);
      yOffset += 10;
    });
  }

  pdf.save(`youtube-analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const generateFacebookReport = async (
  pageData: FacebookPageData | null,
  chartRefs: {
    impressions: HTMLDivElement | null;
    engagedUsers: HTMLDivElement | null;
  }
): Promise<void> => {
  const pdf = new jsPDF();
  let yOffset = 20;

  // Title
  pdf.setFontSize(20);
  pdf.text("Facebook Analytics Report", 20, yOffset);
  yOffset += 10;

  // Page Info
  if (pageData?.pageName) {
    pdf.setFontSize(16);
    pdf.text(`Page: ${pageData.pageName}`, 20, yOffset);
    yOffset += 10;
  }

  // Key Metrics
  pdf.setFontSize(14);
  pdf.text("Key Metrics", 20, yOffset);
  yOffset += 10;
  pdf.setFontSize(12);
  const metrics = [
    {
      name: "Page Fans",
      value:
        pageData?.insights.find((i) => i.name === "page_fans")?.values[0]
          ?.value || 0,
    },
    {
      name: "Total Impressions",
      value:
        pageData?.insights
          .find((i) => i.name === "page_impressions")
          ?.values.reduce((sum, item) => sum + item.value, 0) || 0,
    },
    {
      name: "Unique Impressions",
      value:
        pageData?.insights
          .find((i) => i.name === "page_impressions_unique")
          ?.values.reduce((sum, item) => sum + item.value, 0) || 0,
    },
    {
      name: "Post Engagements",
      value:
        pageData?.insights
          .find((i) => i.name === "page_post_engagements")
          ?.values.reduce((sum, item) => sum + item.value, 0) || 0,
    },
  ];
  metrics.forEach((metric) => {
    pdf.text(`${metric.name}: ${metric.value.toLocaleString()}`, 20, yOffset);
    yOffset += 10;
  });
  yOffset += 10;

  // Charts
  const captureChart = async (
    ref: HTMLDivElement | null,
    title: string
  ): Promise<void> => {
    if (ref) {
      const canvas = await html2canvas(ref, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (yOffset + imgHeight > 280) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.setFontSize(14);
      pdf.text(title, 20, yOffset);
      yOffset += 10;
      pdf.addImage(imgData, "PNG", 20, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;
    }
  };

  await captureChart(chartRefs.impressions, "Page Impressions");
  await captureChart(chartRefs.engagedUsers, "Engaged Users");

  // Recent Posts
  if (pageData?.posts && pageData.posts.length > 0) {
    pdf.setFontSize(14);
    pdf.text("Recent Posts", 20, yOffset);
    yOffset += 10;
    pdf.setFontSize(10);
    pageData.posts.slice(0, 5).forEach((post) => {
      pdf.text(`Post: ${post.message || "(No message)"}`, 20, yOffset, {
        maxWidth: 170,
      });
      yOffset += 10;
      pdf.text(
        `Date: ${new Date(post.created_time).toLocaleDateString()}`,
        20,
        yOffset
      );
      yOffset += 10;
      if (post.insights) {
        pdf.text(
          `Impressions: ${
            post.insights.data.find((i) => i.name === "post_impressions")
              ?.values[0]?.value || 0
          }`,
          20,
          yOffset
        );
        yOffset += 10;
        pdf.text(
          `Unique Views: ${
            post.insights.data.find((i) => i.name === "post_impressions_unique")
              ?.values[0]?.value || 0
          }`,
          20,
          yOffset
        );
        yOffset += 10;
      }
      yOffset += 5;
    });
  }

  pdf.save(`facebook-analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
