/* ============================================
   躺岛 TANGDAO · 贝壳角色内联视觉
   从 assets/shells/*.svg 同步生成，供分享卡导出时内联使用
   TODO: 正式素材替换 SVG 后，重新同步此文件内容
   设计原则：内联 SVG 保证 html-to-image 导出 PNG 时不丢失视觉
   ============================================ */
(function () {
  "use strict";

  const VISUALS = {
    moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="moonGrad" cx="42%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#F6F2FA"/>
      <stop offset="100%" stop-color="#E8E0ED"/>
    </radialGradient>
  </defs>
  <path d="M100 28 C 58 28, 28 70, 28 112 C 28 152, 58 176, 100 176 C 142 176, 172 152, 172 112 C 172 70, 142 28, 100 28 Z" fill="url(#moonGrad)" stroke="#B8A8C8" stroke-width="1.4"/>
  <g stroke="#C8B8D8" stroke-width="0.7" fill="none" opacity="0.55">
    <path d="M100 42 L100 162"/>
    <path d="M68 54 Q100 78, 132 54"/>
    <path d="M48 80 Q100 120, 152 80"/>
    <path d="M38 110 Q100 158, 162 110"/>
  </g>
  <path d="M74 48 Q62 92, 80 132" stroke="#FFFFFF" stroke-width="3.2" fill="none" opacity="0.55" stroke-linecap="round"/>
  <circle cx="100" cy="105" r="3.5" fill="#FFFFFF" opacity="0.6"/>
</svg>`,

    blossom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="blossomGrad" cx="45%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#FBF2F2"/>
      <stop offset="100%" stop-color="#F0DADA"/>
    </radialGradient>
  </defs>
  <path d="M100 30 C 62 30, 32 68, 32 110 C 32 150, 62 174, 100 174 C 138 174, 168 150, 168 110 C 168 68, 138 30, 100 30 Z" fill="url(#blossomGrad)" stroke="#D9A8A6" stroke-width="1.4"/>
  <g stroke="#E0B0AE" stroke-width="0.8" fill="none" opacity="0.6">
    <path d="M100 40 L100 165"/>
    <path d="M66 52 Q100 82, 134 52"/>
    <path d="M46 78 Q100 122, 154 78"/>
    <path d="M36 108 Q100 156, 164 108"/>
  </g>
  <g fill="#E7BBB9" opacity="0.5">
    <ellipse cx="78" cy="70" rx="5" ry="8" transform="rotate(-25 78 70)"/>
    <ellipse cx="122" cy="70" rx="5" ry="8" transform="rotate(25 122 70)"/>
    <ellipse cx="70" cy="120" rx="4" ry="7" transform="rotate(-15 70 120)"/>
    <ellipse cx="130" cy="120" rx="4" ry="7" transform="rotate(15 130 120)"/>
  </g>
  <circle cx="100" cy="100" r="4" fill="#DFA69F" opacity="0.7"/>
  <path d="M76 46 Q66 88, 82 128" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>`,

    iridescent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="iriGrad" x1="30%" y1="20%" x2="70%" y2="80%">
      <stop offset="0%" stop-color="#EAF6F5"/>
      <stop offset="50%" stop-color="#B8E0DE"/>
      <stop offset="100%" stop-color="#9CCECE"/>
    </linearGradient>
    <linearGradient id="iriShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M100 26 C 64 26, 30 64, 30 108 C 30 150, 60 178, 100 178 C 140 178, 170 150, 170 108 C 170 64, 136 26, 100 26 Z" fill="url(#iriGrad)" stroke="#7FB8B6" stroke-width="1.4"/>
  <path d="M50 70 Q100 50, 150 70" stroke="url(#iriShine)" stroke-width="6" fill="none" opacity="0.5"/>
  <path d="M40 105 Q100 85, 160 105" stroke="url(#iriShine)" stroke-width="5" fill="none" opacity="0.4"/>
  <path d="M50 140 Q100 120, 150 140" stroke="url(#iriShine)" stroke-width="4" fill="none" opacity="0.3"/>
  <circle cx="72" cy="88" r="2" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="128" cy="96" r="1.5" fill="#FFFFFF" opacity="0.7"/>
  <circle cx="96" cy="120" r="1.8" fill="#FFFFFF" opacity="0.6"/>
  <circle cx="135" cy="130" r="1.2" fill="#FFFFFF" opacity="0.7"/>
  <path d="M70 44 Q60 90, 78 135" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>
</svg>`,

    pearl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="pearlGrad" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#FBF6EF"/>
      <stop offset="100%" stop-color="#F2E8DD"/>
    </radialGradient>
    <radialGradient id="pearlBall" cx="35%" cy="30%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F5F0E8"/>
      <stop offset="100%" stop-color="#E0D5C5"/>
    </radialGradient>
  </defs>
  <path d="M100 30 C 60 30, 30 68, 30 108 C 30 120, 45 130, 100 130 C 155 130, 170 120, 170 108 C 170 68, 140 30, 100 30 Z" fill="url(#pearlGrad)" stroke="#C8BBA8" stroke-width="1.4"/>
  <path d="M100 130 C 45 130, 30 140, 30 152 C 30 172, 65 180, 100 180 C 135 180, 170 172, 170 152 C 170 140, 155 130, 100 130 Z" fill="url(#pearlGrad)" stroke="#C8BBA8" stroke-width="1.4"/>
  <circle cx="100" cy="128" r="11" fill="url(#pearlBall)" stroke="#D5CAB8" stroke-width="0.8"/>
  <ellipse cx="96" cy="124" rx="3" ry="2" fill="#FFFFFF" opacity="0.8"/>
  <g stroke="#D8CBB8" stroke-width="0.6" fill="none" opacity="0.5">
    <path d="M55 60 Q100 50, 145 60"/>
    <path d="M45 85 Q100 75, 155 85"/>
    <path d="M40 108 Q100 100, 160 108"/>
  </g>
  <path d="M68 48 Q58 88, 74 118" stroke="#FFFFFF" stroke-width="2.8" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>`,

    conch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="conchGrad" cx="45%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#F0F8F8"/>
      <stop offset="100%" stop-color="#D8EBEA"/>
    </radialGradient>
  </defs>
  <path d="M100 30 C 70 30, 45 55, 45 85 C 45 105, 55 120, 72 128 C 60 135, 52 148, 52 162 C 52 175, 68 182, 82 176 C 95 180, 110 178, 122 170 C 140 158, 150 138, 148 118 C 158 108, 162 92, 158 76 C 152 52, 130 30, 100 30 Z" fill="url(#conchGrad)" stroke="#8FBFBF" stroke-width="1.4"/>
  <path d="M100 45 C 80 45, 65 60, 65 80 C 65 95, 74 105, 88 108" stroke="#A8CCCC" stroke-width="1.2" fill="none" opacity="0.7"/>
  <path d="M100 60 C 88 60, 78 70, 78 82 C 78 92, 85 98, 95 98" stroke="#A8CCCC" stroke-width="1" fill="none" opacity="0.6"/>
  <ellipse cx="118" cy="140" rx="22" ry="16" fill="#F7FBFB" stroke="#8FBFBF" stroke-width="1.2"/>
  <ellipse cx="118" cy="140" rx="14" ry="10" fill="#E8F3F2" opacity="0.7"/>
  <path d="M72 52 Q62 95, 80 125" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
  <circle cx="92" cy="72" r="2.5" fill="#FFFFFF" opacity="0.6"/>
</svg>`,

    sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="sunGrad" cx="45%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#FCE8E4"/>
      <stop offset="100%" stop-color="#DFA69F"/>
    </radialGradient>
  </defs>
  <g fill="url(#sunGrad)" stroke="#C98A82" stroke-width="1.2">
    <circle cx="100" cy="100" r="38"/>
    <path d="M100 62 L92 24 L100 36 L108 24 Z"/>
    <path d="M138 100 L176 92 L164 100 L176 108 Z"/>
    <path d="M100 138 L108 176 L100 164 L92 176 Z"/>
    <path d="M62 100 L24 108 L36 100 L24 92 Z"/>
    <path d="M127 73 L154 46 L135 65 L145 48 Z"/>
    <path d="M127 127 L154 154 L145 135 L154 152 Z"/>
    <path d="M73 127 L46 154 L65 135 L48 145 Z"/>
    <path d="M73 73 L46 46 L65 65 L48 54 Z"/>
  </g>
  <g stroke="#C98A82" stroke-width="0.7" opacity="0.5">
    <line x1="100" y1="62" x2="100" y2="30"/>
    <line x1="138" y1="100" x2="170" y2="100"/>
    <line x1="100" y1="138" x2="100" y2="170"/>
    <line x1="62" y1="100" x2="30" y2="100"/>
    <line x1="127" y1="73" x2="148" y2="52"/>
    <line x1="127" y1="127" x2="148" y2="148"/>
    <line x1="73" y1="127" x2="52" y2="148"/>
    <line x1="73" y1="73" x2="52" y2="52"/>
  </g>
  <circle cx="100" cy="100" r="6" fill="#FFFFFF" opacity="0.5"/>
  <path d="M78 78 Q70 100, 82 122" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>
</svg>`
  };

  /**
   * 获取角色内联 SVG 视觉
   * @param {string} roleId 角色 id (moon/blossom/iridescent/pearl/conch/sun)
   * @returns {string} SVG 字符串
   */
  function getShellVisual(roleId) {
    return VISUALS[roleId] || VISUALS.moon;
  }

  window.TANGDAO_SHELL_VISUALS = VISUALS;
  window.tangdaoGetShellVisual = getShellVisual;
  console.log("[Tangdao · 贝壳视觉] 已就绪，6 个角色矢量占位轮廓可用");
})();
