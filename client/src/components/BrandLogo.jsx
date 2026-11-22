import logo from '../assets/logo-mark.svg';

/** The AniHarvest logo mark (wheat, leaf and rising sun). Decorative next to the "AniHarvest" wordmark. */
export default function BrandLogo({ size = 36 }) {
  return <img src={logo} className="brand-logo" width={size} height={size} alt="" aria-hidden="true" />;
}
