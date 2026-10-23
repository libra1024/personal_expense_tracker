type Navigator = {
  canGoBack(): boolean;
  back(): void;
  replace(href: '/'): void;
};

export function exitExpense(navigator: Navigator) {
  if (navigator.canGoBack()) navigator.back();
  else navigator.replace('/');
}
