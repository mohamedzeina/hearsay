const paths = {
  topicShow(topicSlug: string) {
    return `/topics/${topicSlug}`;
  },
  postCreate(topicSlug: string) {
    return `/topics/${topicSlug}/posts/new`;
  },
  postShow(topicSlug: string, postId: string) {
    return `/topics/${topicSlug}/posts/${postId}`;
  },
  userProfile(username: string) {
    return `/u/${encodeURIComponent(username)}`;
  },
  savedPosts() {
    return '/saved';
  },
  notifications() {
    return '/notifications';
  },
};

export default paths;
